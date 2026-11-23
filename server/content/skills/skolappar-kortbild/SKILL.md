---
name: skolappar-kortbild
description: Gör och ladda upp kortbilden som visar en app i katalogen på skolappar.com. Använd när en inskickad skolapp saknar bild eller när bilden ska göras om.
---

# Kortbild till en skolapp

Kortbilden är det första ett barn ser av appen. Den ska visa **ett ögonblick inifrån spelet**.

## Så ska den se ut

- Inzoomad på spelytan: figuren vid uppgiften, tangenterna, hjulet som snurrar.
- Liggande **4:3**, minst **1200 × 900 px**, motivet i mitten.
- Inte startsidan, inte en "Spela"-skärm, ingen meny, ingen webbläsarram.
- Ingen text som blir oläslig i litet format, och inte appens namn, årskurs eller ämne i bilden.
- Ingen egen ram eller bakgrund runt: kortet lägger själv en ram i ämnets färg.
- Utan bild får kortet ämnets färg och symbol. Det är bättre än en dålig bild.

## Två sätt att göra den

**Skärmdump ur spelet.** Öppna appen i 1200 × 900, spela fram till ett bra läge mitt i en uppgift
och ta bilden av spelytan. Med Playwright:

```js
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
await page.goto(appUrl);
await page.getByRole('button', { name: 'Spela' }).click();
await page.screenshot({ path: 'kortbild.png' });
```

**Ritad SVG.** Rita motivet som SVG med `viewBox="0 0 1200 900"`: stora former, få detaljer,
appens egna färger. Inga skript, inga externa bilder eller typsnitt.

## Ladda upp

Med appens `app_key` (från `submit_app`), medan appen väntar på granskning:

- SVG: `set_my_app_image` med `svg`.
- En bild som redan ligger på en publik adress: `set_my_app_image` med `image_url`.
- En bildfil:

```bash
curl -X PUT --data-binary @kortbild.png -H "X-App-Key: <app_key>" https://www.skolappar.com/api/apps/<id>/image
```

Titta på resultatet: `app_status` visar läget, och bilden syns på kortet när appen är publicerad.
