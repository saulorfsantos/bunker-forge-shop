# Card 153 — auditoria live read-only do catálogo

- Executada em: `2026-09-17T10:21:09-03:00`
- Operação remota: exclusivamente `GET /store/products` na Store API pública configurada pelo storefront
- Mutação remota: **nenhuma**
- Total: **71** produtos
- `backend image`: **57**
- `thumbnail`: **0**
- `exact local handle/id fallback`: **0**
- `placeholder`: **14**
- URLs backend-associated: **11 R2**, **45 picsum**, **1 localhost**
- Produtos com mais de uma variante: **0**
- `LIVE_MULTI_VARIANT_PRODUCT: NONE`

> `backend-associated` significa apenas que o backend associou a URL ao produto. Não é uma
> afirmação de correção semântica. Em especial, as 45 URLs `picsum` exigem substituição/validação
> humana e a URL `localhost` do Canivete Jiboia é inutilizável fora do host do backend.

## Produtos placeholder

Não existe pasta local cujo nome corresponda exatamente ao `handle` ou ao `id` de nenhum destes
produtos. Nenhuma imagem foi atribuída por similaridade, aparência ou posição. Candidatos locais
inequívocos: **NONE**.

| ID | Handle | Produto | Variante |
| --- | --- | --- | --- |
| `prod_01KW4KQ8MF0W7DGESCAS1F3D1C` | `luneta-rossi-1-2-6x24-lpvo` | Luneta Rossi 1.2-6x24 LPVO | Padrão (`BNK-0059`) |
| `prod_01KW4KQ8MF35H5BYJ9X48AZE1M` | `luneta-rossi-gold-crown-3-9x40eg` | Luneta Rossi Gold Crown 3-9x40EG | Padrão (`BNK-0058`) |
| `prod_01KW4KQ8MF6BQN3PQD3N68NCCR` | `red-dot-rossi-553-black` | Red Dot Rossi 553 Black | Padrão (`BNK-0062`) |
| `prod_01KW4KQ8MFA3EQ2SNAWZHXGEHV` | `red-dot-rossi-553-tan` | Red Dot Rossi 553 TAN | Padrão (`BNK-0061`) |
| `prod_01KW4KQ8MFG929EJA1BANDTBYK` | `red-dot-rossi-558` | Red Dot Rossi 558 | Padrão (`BNK-0060`) |
| `prod_01KW4KQ8MG39TCY2K143XWXJ28` | `red-dot-rossi-romeo-tan` | Red Dot Rossi ROMEO TAN | Padrão (`BNK-0064`) |
| `prod_01KW4KQ8MG4AB3ZFXKNGSXAR6M` | `red-dot-rossi-m1` | Red Dot Rossi M1 | Padrão (`BNK-0067`) |
| `prod_01KW4KQ8MG63Q70HK8MV30J50T` | `red-dot-rossi-romeo-bk` | Red Dot Rossi ROMEO BK | Padrão (`BNK-0065`) |
| `prod_01KW4KQ8MG881PDNYP0MF4WKE2` | `red-dot-rossi-1x32c-acog` | Red Dot Rossi 1x32C ACOG | Padrão (`BNK-0066`) |
| `prod_01KW4KQ8MGE6Y29KW801RHDDRC` | `luneta-rossi-3-9x26egc-ris` | Luneta Rossi 3-9x26EGC RIS | Padrão (`BNK-0069`) |
| `prod_01KW4KQ8MGG5M0JTV8HBX43B73` | `red-dot-rossi-m3` | Red Dot Rossi M3 | Padrão (`BNK-0063`) |
| `prod_01KW4KQ8MGJEV63XMPJK080S59` | `luneta-rossi-4-16x42ao` | Luneta Rossi 4-16x42AO | Padrão (`BNK-0071`) |
| `prod_01KW4KQ8MGW4H1D4GS11XWXZRF` | `luneta-rossi-magnifier-3x` | Luneta Rossi Magnifier 3x | Padrão (`BNK-0068`) |
| `prod_01KW4KQ8MGXREG0D3QMXAR3J73` | `luneta-rossi-6-24x42ao` | Luneta Rossi 6-24x42AO | Padrão (`BNK-0070`) |

## Catálogo completo e auditoria semântica

Todos os 71 produtos têm exatamente uma variante live. A coluna de confiança não promove associação
backend a correspondência semântica.

| PRODUCT (id · handle · title) | VARIANTS (title · SKU) | CURRENT_IMAGE_SOURCE | CURRENT_IMAGE | CONFIDENCE |
| --- | --- | --- | --- | --- |
| `prod_01KS8A4RFZ05B8E10CYSQWZG3B` · `bbs-tango-down-0-20g-2-800un` · BB's Tango Down 0.20g 2.800un | Padrão · `BNK-0002` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/Tango%20Down-01KWTFMWPHR78108G8CMZE5H8Q.png) | backend-associated |
| `prod_01KS8A4RFZ1CDZ7H9CX2QKMHT6` · `bbs-tango-down-0-30g-2-800un` · BB's Tango Down 0.30g 2.800un | Padrão · `BNK-0008` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/1224-x1ycb2lps0-01KWTFWFX4MT05Z1922AE01N4A.webp) | backend-associated |
| `prod_01KS8A4RFZ4G5H2X1KN8JFTK6W` · `bbs-tango-down-0-28g-5000un` · BB's Tango Down 0.28g 5000un | Padrão · `BNK-0005` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/Tango%20Down%20028-01KWTFZ69YG8WG8X527WA1H206.webp) | backend-associated |
| `prod_01KS8A4RFZ8B9MNSHY2EREX3G4` · `bbs-tango-down-0-25g-2-800un` · BB's Tango Down 0.25g 2.800un | Padrão · `BNK-0004` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/BB's%20Tango%20Down%20025g%202800un%20%20-01KWTG20JYTKPHN5XFZ8XBE1XM.webp) | backend-associated |
| `prod_01KS8A4RFZBKNFWK3B58S2EBAF` · `bbs-tracer-tango-down-0-25g-2-800un` · BB's Tracer Tango Down 0.25g 2.800un | Padrão · `BNK-0010` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/BB's%20Tracer%20Tango%20Down%20025g%202800un%20%20-01KWTG6B3FYQC2WXCCEE2JQVBK.webp) | backend-associated |
| `prod_01KS8A4RFZFN7AS639JS8S275F` · `bbs-sniper-tango-down-0-36g-1-000un` · BB's Sniper Tango Down 0.36g 1.000un | Padrão · `BNK-0012` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/BB's%20Sniper%20Tango%20Down%20036g%201000un%20%20-01KWTGAFSS20AZRAZ3VJ7MG377.webp) | backend-associated |
| `prod_01KS8A4RFZH69JRSE59X8Y343K` · `bbs-tango-down-0-30g-5000un` · BB's Tango Down 0.30g 5000un | Padrão · `BNK-0007` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/BB's%20Tango%20Down%20030g%205000un%20%20-01KWTGCXA1KBXY3GEVYQ3FMCZF.webp) | backend-associated |
| `prod_01KS8A4RFZVFDGV8JE9585Q0Y9` · `bbs-tango-down-0-28g-2-800un` · BB's Tango Down 0.28g 2.800un | Padrão · `BNK-0006` | backend image | [URL](https://picsum.photos/seed/bbs-tango-down-0-28g-2-800un/600/600) | backend-associated |
| `prod_01KS8A4RFZW1JBK2GSTM1855CP` · `bbs-sniper-tango-down-0-32g-2-000un` · BB's Sniper Tango Down 0.32g 2.000un | Padrão · `BNK-0011` | backend image | [URL](https://picsum.photos/seed/bbs-sniper-tango-down-0-32g-2-000un/600/600) | backend-associated |
| `prod_01KS8A4RFZYASNRKKKB5HXSZM5` · `bbs-tango-down-0-20g-5000un` · BB's Tango Down 0.20g 5000un | Padrão · `BNK-0001` | backend image | [URL](https://picsum.photos/seed/bbs-tango-down-0-20g-5000un/600/600) | backend-associated |
| `prod_01KS8A4RFZZTQ5KE4W7EEFVZBG` · `bbs-tango-down-0-25g-5000un` · BB's Tango Down 0.25g 5000un | Padrão · `BNK-0003` | backend image | [URL](https://picsum.photos/seed/bbs-tango-down-0-25g-5000un/600/600) | backend-associated |
| `prod_01KS8A4RFZZXX8KBPBJP3QA9G1` · `bbs-sniper-tango-down-0-36g-500un` · BB's Sniper Tango Down 0.36g 500un | Padrão · `BNK-0013` | backend image | [URL](https://picsum.photos/seed/bbs-sniper-tango-down-0-36g-500un/600/600) | backend-associated |
| `prod_01KS8A4RFZZZVQE7Y4XJS5T19V` · `bbs-tracer-tango-down-0-25g-5000un` · BB's Tracer Tango Down 0.25g 5000un | Padrão · `BNK-0009` | backend image | [URL](https://picsum.photos/seed/bbs-tracer-tango-down-0-25g-5000un/600/600) | backend-associated |
| `prod_01KS8A4RG01K23BTS7R46DMNJ1` · `magazine-m4-mid-cap-hp-polimero-130-bbs-rossi` · Magazine M4 Mid-Cap HP Polímero 130 BB's Rossi | Padrão · `BNK-0027` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/Magazine%20M4%20Mid-Cap%20HP%20Pol%C3%83%C2%ADmero%20130%20BB's%20Rossi%2001-01KWTGK9PFN561X4G61M9T7ZRW.webp) | backend-associated |
| `prod_01KS8A4RG04XRKBE416PB3NWY8` · `bbs-sniper-tango-down-0-40g-500un` · BB's Sniper Tango Down 0.40g 500un | Padrão · `BNK-0015` | backend image | [URL](https://picsum.photos/seed/bbs-sniper-tango-down-0-40g-500un/600/600) | backend-associated |
| `prod_01KS8A4RG06CVR48YY17005Y3W` · `colete-tatico-modular-sp-033-woodland-rossi` · Colete Tático Modular SP-033 Woodland Rossi | Padrão · `BNK-0022` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/Colete%20T%C3%83%C2%A1tico%20Modular%20SP-033%20Woodland%20Rossi-01KWTGP00FH59ARKMCF4DXK2CH.webp) | backend-associated |
| `prod_01KS8A4RG06GKC1GS79XKAE7WK` · `bbs-sniper-tango-down-0-45g-1-000un` · BB's Sniper Tango Down 0.45g 1.000un | Padrão · `BNK-0017` | backend image | [URL](https://picsum.photos/seed/bbs-sniper-tango-down-0-45g-1-000un/600/600) | backend-associated |
| `prod_01KS8A4RG095XS8R1Z4EC0N0RK` · `bbs-sniper-tango-down-0-48g-1-000un` · BB's Sniper Tango Down 0.48g 1.000un | Padrão · `BNK-0018` | backend image | [URL](https://picsum.photos/seed/bbs-sniper-tango-down-0-48g-1-000un/600/600) | backend-associated |
| `prod_01KS8A4RG09X2AM91B1AQ8P42W` · `bbs-sniper-tango-down-0-40g-1-000un` · BB's Sniper Tango Down 0.40g 1.000un | Padrão · `BNK-0014` | backend image | [URL](https://picsum.photos/seed/bbs-sniper-tango-down-0-40g-1-000un/600/600) | backend-associated |
| `prod_01KS8A4RG0A30ZZJ4ZEM4E9GCJ` · `bbs-sniper-tango-down-0-50g-500un` · BB's Sniper Tango Down 0.50g 500un | Padrão · `BNK-0020` | backend image | [URL](https://picsum.photos/seed/bbs-sniper-tango-down-0-50g-500un/600/600) | backend-associated |
| `prod_01KS8A4RG0HZHZ43BQJSM1EA6C` · `bbs-sniper-tango-down-0-48g-500un` · BB's Sniper Tango Down 0.48g 500un | Padrão · `BNK-0019` | backend image | [URL](https://picsum.photos/seed/bbs-sniper-tango-down-0-48g-500un/600/600) | backend-associated |
| `prod_01KS8A4RG0JXKGW4165K63Y8XN` · `bbs-sniper-tango-down-0-45g-500un` · BB's Sniper Tango Down 0.45g 500un | Padrão · `BNK-0016` | backend image | [URL](https://picsum.photos/seed/bbs-sniper-tango-down-0-45g-500un/600/600) | backend-associated |
| `prod_01KS8A4RG0Q029JBZV1A4N60WH` · `magazine-m4-mid-cap-polimero-100-bbs-rossi` · Magazine M4 Mid-Cap Polímero 100 BB's Rossi | Padrão · `BNK-0026` | backend image | [URL](https://picsum.photos/seed/magazine-m4-mid-cap-polimero-100-bbs-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG0QXSPS7EM10SZR49M` · `colete-tatico-modular-sp-033-verde-militar-rossi` · Colete Tático Modular SP-033 Verde Militar Rossi | Padrão · `BNK-0021` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/Colete%20T%C3%83%C2%A1tico%20Modular%20SP-033%20Verde%20Militar%20Rossi-01KWTGZKG2XN752SAEMBKK4JHD.jpg) | backend-associated |
| `prod_01KS8A4RG0RKBC3QDB3HDVXWF6` · `magazine-ak-mid-cap-polimero-130-bbs-rossi` · Magazine AK Mid-Cap Polímero 130 BB's Rossi | Padrão · `BNK-0025` | backend image | [URL](https://pub-0e131148970b43ad9ce71e328c809de2.r2.dev/MAG-ROSSI-AK47-3-01KWTGSG2D9CPVWX6E6SAZXAZA.jpg) | backend-associated |
| `prod_01KS8A4RG0TCNAQD4KXBDD9YWP` · `magazine-green-gas-pistola-1911-redwings-rossi` · Magazine Green Gás Pistola 1911 Redwings Rossi | Padrão · `BNK-0024` | backend image | [URL](https://picsum.photos/seed/magazine-green-gas-pistola-1911-redwings-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG0ZSH1JGZK8XP8TQV9` · `magazine-green-gas-pistola-glock-r17-r18-rossi` · Magazine Green Gás Pistola Glock R17/R18 Rossi | Padrão · `BNK-0023` | backend image | [URL](https://picsum.photos/seed/magazine-green-gas-pistola-glock-r17-r18-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG10B2S20MT023JHK59` · `suporte-bandoleira-engate-rapido-metal` · Suporte Bandoleira Engate Rápido Metal | Padrão · `BNK-0040` | backend image | [URL](https://picsum.photos/seed/suporte-bandoleira-engate-rapido-metal/600/600) | backend-associated |
| `prod_01KS8A4RG110HX3VDKSWJA9SRZ` · `luneta-rossi-4-5x20-wa-mount-3-8-11mm` · Luneta Rossi 4.5x20 WA Mount 3/8 11mm | Padrão · `BNK-0034` | backend image | [URL](https://picsum.photos/seed/luneta-rossi-4-5x20-wa-mount-3-8-11mm/600/600) | backend-associated |
| `prod_01KS8A4RG123Y37NJZKH3V8KJG` · `elevador-de-mount-para-trilho-22mm` · Elevador de Mount para Trilho 22mm | Padrão · `BNK-0039` | backend image | [URL](https://picsum.photos/seed/elevador-de-mount-para-trilho-22mm/600/600) | backend-associated |
| `prod_01KS8A4RG13AH95FDADMTJXSS2` · `bipe-rossi-6-9-fixo-estilo-harris` · Bipé Rossi 6-9 Fixo Estilo Harris | Padrão · `BNK-0038` | backend image | [URL](https://picsum.photos/seed/bipe-rossi-6-9-fixo-estilo-harris/600/600) | backend-associated |
| `prod_01KS8A4RG13MEBWEKHAPRPPPPY` · `luneta-rossi-gold-crown-4x32-pcp` · Luneta Rossi Gold Crown 4x32 PCP | Padrão · `BNK-0035` | backend image | [URL](https://picsum.photos/seed/luneta-rossi-gold-crown-4x32-pcp/600/600) | backend-associated |
| `prod_01KS8A4RG17ZDRD1Z467B8RX43` · `magazine-m4-mid-cap-full-metal-110-bbs-rossi` · Magazine M4 Mid-Cap Full Metal 110 BB's Rossi | Padrão · `BNK-0029` | backend image | [URL](https://picsum.photos/seed/magazine-m4-mid-cap-full-metal-110-bbs-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG186RYZP6790F1N65R` · `mira-red-dot-mini-1x18-rossi` · Mira Red Dot Mini 1x18 Rossi | Padrão · `BNK-0032` | backend image | [URL](https://picsum.photos/seed/mira-red-dot-mini-1x18-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG19SSR9R56SXTP37KP` · `canivete-jiboia-karambit-f386-rossi` · Canivete Jiboia Karambit F386 Rossi | Padrão · `BNK-0041` | backend image | [URL](http://localhost:9000/static/1782591286651-81962e51-13fc-492e-acb8-a387e572686c001.webp) | backend-associated |
| `prod_01KS8A4RG1AQ57ZVVZRZTPTG7S` · `coldre-tan-porta-magazine-pistola-rossi` · Coldre Tan Porta Magazine Pistola Rossi | Padrão · `BNK-0037` | backend image | [URL](https://picsum.photos/seed/coldre-tan-porta-magazine-pistola-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG1F76Q6085G9NNSP20` · `magazine-m4-hi-cap-hp-polimero-350-bbs-rossi` · Magazine M4 Hi-Cap HP Polímero 350 BB's Rossi | Padrão · `BNK-0028` | backend image | [URL](https://picsum.photos/seed/magazine-m4-hi-cap-hp-polimero-350-bbs-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG1K7FPYKESFSD9BFEB` · `magazine-m4-hi-cap-full-metal-300-bbs-rossi` · Magazine M4 Hi-Cap Full Metal 300 BB's Rossi | Padrão · `BNK-0030` | backend image | [URL](https://picsum.photos/seed/magazine-m4-hi-cap-full-metal-300-bbs-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG1KFV0GDX8CAWZ5AP2` · `mira-holografica-dot-551-red-green-rossi` · Mira Holográfica Dot 551 Red/Green Rossi | Padrão · `BNK-0031` | backend image | [URL](https://picsum.photos/seed/mira-holografica-dot-551-red-green-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG1KN27YVKQNPYVD1MG` · `coldre-tan-porta-magazine-m4-ak-rossi` · Coldre Tan Porta Magazine M4/AK Rossi | Padrão · `BNK-0036` | backend image | [URL](https://picsum.photos/seed/coldre-tan-porta-magazine-m4-ak-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG1SG65YQZ3XAX2NMCT` · `luneta-discovery-ht-nv-3x24ir-reticulo-iluminado` · Luneta Discovery HT-NV 3x24IR Retículo Iluminado | Padrão · `BNK-0033` | backend image | [URL](https://picsum.photos/seed/luneta-discovery-ht-nv-3x24ir-reticulo-iluminado/600/600) | backend-associated |
| `prod_01KS8A4RG219AC4XEXGHBJP6GS` · `combo-specna-arms-5-mid-cap-125-bbs` · Combo Specna Arms 5 Mid-Cap 125 BB's | Padrão · `BNK-0045` | backend image | [URL](https://picsum.photos/seed/combo-specna-arms-5-mid-cap-125-bbs/600/600) | backend-associated |
| `prod_01KS8A4RG22ZTEP12Y4FMJVRA3` · `cilindro-co2-12g-leao` · Cilindro CO2 12g Leão | Padrão · `BNK-0049` | backend image | [URL](https://picsum.photos/seed/cilindro-co2-12g-leao/600/600) | backend-associated |
| `prod_01KS8A4RG26EG1RQJCN2PS4726` · `lipo-bag-lipo-safe-leao` · Lipo Bag Lipo-Safe Leão | Padrão · `BNK-0047` | backend image | [URL](https://picsum.photos/seed/lipo-bag-lipo-safe-leao/600/600) | backend-associated |
| `prod_01KS8A4RG285B9M8VKCRDH78X1` · `green-gas-12kg-com-silicone-leao` · Green Gás 12kg com Silicone Leão | Padrão · `BNK-0048` | backend image | [URL](https://picsum.photos/seed/green-gas-12kg-com-silicone-leao/600/600) | backend-associated |
| `prod_01KS8A4RG2CGX6SSKPQNJZM5Q1` · `maleta-pistola-desert-premium-tan` · Maleta Pistola Desert Premium Tan | Padrão · `BNK-0044` | backend image | [URL](https://picsum.photos/seed/maleta-pistola-desert-premium-tan/600/600) | backend-associated |
| `prod_01KS8A4RG2DP4RPTGHYZJS6YXJ` · `bateria-lipo-ultra-leao-7-4v-2s-250mah-20c-aep` · Bateria LiPo Ultra Leão 7.4V/2S 250mAh 20C AEP | Padrão · `BNK-0050` | backend image | [URL](https://picsum.photos/seed/bateria-lipo-ultra-leao-7-4v-2s-250mah-20c-aep/600/600) | backend-associated |
| `prod_01KS8A4RG2F4H0CFMAJ7FNF3ES` · `bateria-lipo-ultra-leao-11-1v-3s-900mah-20c-40c-xt60` · Bateria LiPo Ultra Leão 11.1V/3S 900mAh 20C/40C XT60 | Padrão · `BNK-0054` | backend image | [URL](https://picsum.photos/seed/bateria-lipo-ultra-leao-11-1v-3s-900mah-20c-40c-xt60/600/600) | backend-associated |
| `prod_01KS8A4RG2HGCRH98F1RTVMQQ2` · `bateria-lipo-ultra-leao-11-1v-3s-1100mah-20c-40c-xt60` · Bateria LiPo Ultra Leão 11.1V/3S 1100mAh 20C/40C XT60 | Padrão · `BNK-0052` | backend image | [URL](https://picsum.photos/seed/bateria-lipo-ultra-leao-11-1v-3s-1100mah-20c-40c-xt60/600/600) | backend-associated |
| `prod_01KS8A4RG2JCHKXZFS7Q82QV5J` · `canivete-jararaca-f067-lrw-rossi` · Canivete Jararaca F067 LRW Rossi | Padrão · `BNK-0043` | backend image | [URL](https://picsum.photos/seed/canivete-jararaca-f067-lrw-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG2QBHMW99KCZJB4EHH` · `bateria-lipo-ultra-leao-11-1v-3s-1100mah-20c-40c-deans` · Bateria LiPo Ultra Leão 11.1V/3S 1100mAh 20C/40C Deans | Padrão · `BNK-0051` | backend image | [URL](https://picsum.photos/seed/bateria-lipo-ultra-leao-11-1v-3s-1100mah-20c-40c-deans/600/600) | backend-associated |
| `prod_01KS8A4RG2QD7HE4VXC31XEF6W` · `oculos-tatico-warmmo-3-lentes` · Óculos Tático Warmmo 3 Lentes | Padrão · `BNK-0046` | backend image | [URL](https://picsum.photos/seed/oculos-tatico-warmmo-3-lentes/600/600) | backend-associated |
| `prod_01KS8A4RG2TD5RY00P6BN57M19` · `canivete-sucuri-f121-2-rossi` · Canivete Sucuri F121-2 Rossi | Padrão · `BNK-0042` | backend image | [URL](https://picsum.photos/seed/canivete-sucuri-f121-2-rossi/600/600) | backend-associated |
| `prod_01KS8A4RG2VNT24N05R64Q0M3B` · `bateria-lipo-ultra-leao-11-1v-3s-1100mah-20c-40c-tamiya` · Bateria LiPo Ultra Leão 11.1V/3S 1100mAh 20C/40C Tamiya | Padrão · `BNK-0053` | backend image | [URL](https://picsum.photos/seed/bateria-lipo-ultra-leao-11-1v-3s-1100mah-20c-40c-tamiya/600/600) | backend-associated |
| `prod_01KS8A4RG3CRH17484WFPBHEEM` · `bateria-lipo-ultra-leao-11-1v-3s-ak-series-1400mah-25c-50c-mini-tamiya` · Bateria LiPo Ultra Leão 11.1V/3S AK Series 1400mAh 25C/50C Mini Tamiya | Padrão · `BNK-0057` | backend image | [URL](https://picsum.photos/seed/bateria-lipo-ultra-leao-11-1v-3s-ak-series-1400mah-25c-50c-mini-tamiya/600/600) | backend-associated |
| `prod_01KS8A4RG3SCF1PXN2K3K2Z1PN` · `bateria-lipo-ultra-leao-11-1v-3s-3-pack-1100mah-20c-40c-deans` · Bateria LiPo Ultra Leão 11.1V/3S 3-Pack 1100mAh 20C/40C Deans | Padrão · `BNK-0055` | backend image | [URL](https://picsum.photos/seed/bateria-lipo-ultra-leao-11-1v-3s-3-pack-1100mah-20c-40c-deans/600/600) | backend-associated |
| `prod_01KS8A4RG3V908PFAS7Y6D0KMC` · `bateria-lipo-ultra-leao-11-1v-3s-3-pack-1100mah-20c-40c-tamiya` · Bateria LiPo Ultra Leão 11.1V/3S 3-Pack 1100mAh 20C/40C Tamiya | Padrão · `BNK-0056` | backend image | [URL](https://picsum.photos/seed/bateria-lipo-ultra-leao-11-1v-3s-3-pack-1100mah-20c-40c-tamiya/600/600) | backend-associated |
| `prod_01KW4KQ8MF0W7DGESCAS1F3D1C` · `luneta-rossi-1-2-6x24-lpvo` · Luneta Rossi 1.2-6x24 LPVO | Padrão · `BNK-0059` | placeholder | — | unresolved |
| `prod_01KW4KQ8MF35H5BYJ9X48AZE1M` · `luneta-rossi-gold-crown-3-9x40eg` · Luneta Rossi Gold Crown 3-9x40EG | Padrão · `BNK-0058` | placeholder | — | unresolved |
| `prod_01KW4KQ8MF6BQN3PQD3N68NCCR` · `red-dot-rossi-553-black` · Red Dot Rossi 553 Black | Padrão · `BNK-0062` | placeholder | — | unresolved |
| `prod_01KW4KQ8MFA3EQ2SNAWZHXGEHV` · `red-dot-rossi-553-tan` · Red Dot Rossi 553 TAN | Padrão · `BNK-0061` | placeholder | — | unresolved |
| `prod_01KW4KQ8MFG929EJA1BANDTBYK` · `red-dot-rossi-558` · Red Dot Rossi 558 | Padrão · `BNK-0060` | placeholder | — | unresolved |
| `prod_01KW4KQ8MG39TCY2K143XWXJ28` · `red-dot-rossi-romeo-tan` · Red Dot Rossi ROMEO TAN | Padrão · `BNK-0064` | placeholder | — | unresolved |
| `prod_01KW4KQ8MG4AB3ZFXKNGSXAR6M` · `red-dot-rossi-m1` · Red Dot Rossi M1 | Padrão · `BNK-0067` | placeholder | — | unresolved |
| `prod_01KW4KQ8MG63Q70HK8MV30J50T` · `red-dot-rossi-romeo-bk` · Red Dot Rossi ROMEO BK | Padrão · `BNK-0065` | placeholder | — | unresolved |
| `prod_01KW4KQ8MG881PDNYP0MF4WKE2` · `red-dot-rossi-1x32c-acog` · Red Dot Rossi 1x32C ACOG | Padrão · `BNK-0066` | placeholder | — | unresolved |
| `prod_01KW4KQ8MGE6Y29KW801RHDDRC` · `luneta-rossi-3-9x26egc-ris` · Luneta Rossi 3-9x26EGC RIS | Padrão · `BNK-0069` | placeholder | — | unresolved |
| `prod_01KW4KQ8MGG5M0JTV8HBX43B73` · `red-dot-rossi-m3` · Red Dot Rossi M3 | Padrão · `BNK-0063` | placeholder | — | unresolved |
| `prod_01KW4KQ8MGJEV63XMPJK080S59` · `luneta-rossi-4-16x42ao` · Luneta Rossi 4-16x42AO | Padrão · `BNK-0071` | placeholder | — | unresolved |
| `prod_01KW4KQ8MGW4H1D4GS11XWXZRF` · `luneta-rossi-magnifier-3x` · Luneta Rossi Magnifier 3x | Padrão · `BNK-0068` | placeholder | — | unresolved |
| `prod_01KW4KQ8MGXREG0D3QMXAR3J73` · `luneta-rossi-6-24x42ao` · Luneta Rossi 6-24x42AO | Padrão · `BNK-0070` | placeholder | — | unresolved |

## Variant gate live

`LIVE_MULTI_VARIANT_PRODUCT: NONE`

O blocker do item 3 é **dado de catálogo**, não frontend: todos os 71 produtos retornados pelo
catálogo público têm exatamente uma variante. Nenhuma variante foi criada ou alterada.
