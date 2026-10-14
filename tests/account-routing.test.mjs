import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import ts from "typescript";

// Load the real account layout without requiring a browser or a customer session.
const source = readFileSync(new URL("../src/routes/account.tsx", import.meta.url), "utf8");
const compiled = ts
  .transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  .outputText.replaceAll(
    '"@tanstack/react-router"',
    JSON.stringify(import.meta.resolve("@tanstack/react-router")),
  );

for (const [path, visible, hidden] of [
  ["/account", "Lista de pedidos", "Detalhe do pedido"],
  ["/account/orders/order_test", "Detalhe do pedido", "Lista de pedidos"],
]) {
  test(`account layout renders the matching child at ${path}`, async () => {
    const { Route } = await import(
      `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}#${path}`
    );
    const root = createRootRoute();
    const account = Route.update({
      id: "/account",
      path: "/account",
      getParentRoute: () => root,
    });
    const index = createRoute({
      getParentRoute: () => account,
      path: "/",
      component: () => createElement("h1", null, "Lista de pedidos"),
    });
    const detail = createRoute({
      getParentRoute: () => account,
      path: "orders/$orderId",
      component: () => createElement("h1", null, "Detalhe do pedido"),
    });
    const router = createRouter({
      routeTree: root.addChildren([account.addChildren([index, detail])]),
      history: createMemoryHistory({ initialEntries: [path] }),
      isServer: true,
    });
    await router.load();
    const html = renderToString(createElement(RouterProvider, { router }));
    assert.ok(html.includes(visible));
    assert.ok(!html.includes(hidden));
  });
}
