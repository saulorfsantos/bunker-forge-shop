import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import net from "node:net";
import test from "node:test";
import { fileURLToPath } from "node:url";

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(address.port);
      });
    });
  });
}

function startProcess(relativeScript, environment) {
  return spawn(process.execPath, [fileURLToPath(new URL(relativeScript, import.meta.url))], {
    env: { ...process.env, ...environment },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function waitUntilListening(child) {
  return new Promise((resolve, reject) => {
    let stderr = "";
    const timeout = setTimeout(() => reject(new Error("Process startup timed out.")), 5_000);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.stdout.once("data", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Process exited before listening (${code}): ${stderr}`));
    });
  });
}

function stopProcess(child) {
  if (child && !child.killed) {
    child.kill("SIGTERM");
  }
}

test("proxies only a runtime token to the loopback mock", async () => {
  const [mockPort, harnessPort] = await Promise.all([availablePort(), availablePort()]);
  const mock = startProcess("../mock-backend.mjs", {
    MP_HARNESS_MOCK_PORT: String(mockPort),
  });
  let harness;

  try {
    await waitUntilListening(mock);
    harness = startProcess("../server.mjs", {
      MERCADO_PAGO_PUBLIC_KEY: randomBytes(24).toString("base64url"),
      MP_HARNESS_BACKEND_URL: `http://127.0.0.1:${mockPort}`,
      MP_HARNESS_PORT: String(harnessPort),
    });
    await waitUntilListening(harness);

    const response = await fetch(`http://127.0.0.1:${harnessPort}/api/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: randomBytes(24).toString("base64url"),
        transaction_amount: 1,
        payment_method_id: "test",
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: "approved",
      status_detail: "local_mock_only",
    });
  } finally {
    stopProcess(harness);
    stopProcess(mock);
  }
});

test("server hard-stops before listening when the backend target is remote", async () => {
  const harness = startProcess("../server.mjs", {
    MERCADO_PAGO_PUBLIC_KEY: randomBytes(24).toString("base64url"),
    MP_HARNESS_BACKEND_URL: "https://example.test",
    MP_HARNESS_PORT: String(await availablePort()),
  });

  const exitCode = await new Promise((resolve) => harness.once("exit", resolve));
  assert.notEqual(exitCode, 0);
});
