---
name: skolappar-bygg
description: Bygg en pedagogisk webbapp för barn (en "skolapp") som fungerar på iPad och blir godkänd på skolappar.org. Använd när någon vill göra ett lärospel eller en övningsapp åt ett barn, ensam eller tillsammans med barnet.
---

# Bygg en skolapp

En skolapp tränar **en** sak, startar direkt utan konto och går att spela med bara fingret på en iPad.
Skolappar.org har en guide för vad som krävs och en startmall där det svåra redan är löst.

Anslut till `https://www.skolappar.org/mcp` (MCP över HTTP, ingen nyckel). Finns ingen MCP: samma
innehåll ligger på `https://www.skolappar.org/guide.md` och `https://www.skolappar.org/starter/`.

## Gör så här

1. **Läs guiden** med `get_guide` innan du skriver kod. Den är kort och avgör om appen blir godkänd.
2. **Bestäm idén tillsammans med barnet**: vad ska övas, för vilken årskurs? Saknas en idé visar
   `list_ideas` vad lärare och föräldrar önskar sig. Se med `list_apps` om något liknande finns.
3. **Välj punkt i läroplanen** med `get_curriculum`: sök på ämne och stadium eller på ett ord.
   Välj en till tre punkter i det centrala innehållet (Lgr22) och spara deras id – de följer med
   när appen skickas in. Avsnittet `laroplan` i guiden säger mer.
4. **Utgå från startmallen**: `get_starter` ger filerna. Byt `tasks.js` (innehållet) och låt
   `app.js` (motorn) vara: omgångar, återkoppling, svårighet, ljud, uppläsning och sparning finns redan.
   Bygger du med ett eget ramverk gäller samma krav – gå igenom guidens avsnitt `touch` och `barnet`.
5. **Lägg in kodsnutten** (startmallen har den): en rad `<script src="https://www.skolappar.org/kotten.js" defer>`
   och `skolappar.event('level', n)` när barnet når en nivå, `skolappar.event('round_start')` och `skolappar.event('round_done', procent)` runt en omgång.
   Då visar `app_stats` hur långt barnen kommer och var de slutar – anonymt. Guidens avsnitt `kodsnutten`.
6. **Ge appen en röst**: det appen säger varje gång (frågor, beröm) blir inspelade repliker – Shipholms
   verktyg speak med rösten **`omni`** (naturligast; visa raden `attribution` från svaret i en Om-ruta
   eller sidfot), gratis (skill shipholm-voice). Ladda ner filerna till appen. Text som inte går att veta
   i förväg (barnets egen saga) läses medan appen används med `POST https://api.shipholm.com/speak`
   och `"voice": "omni"`. **Ingen `speechSynthesis` – inte ens som reserv**: saknas en fil, visa texten
   och var tyst. Sök efter `speechSynthesis` innan du är klar; det ska ge noll träffar. Guidens avsnitt `resurser`.
   **Bilder**: Shipholms verktyg draw ritar illustrationer som SVG i en och samma bilderboksstil
   (skill shipholm-draw) – figurer, djur, saker att räkna. En läsapp kan låta barnet läsa högt och
   kontrollera orden med Shipholms taligenkänning (skill shipholm-listen); inget sparas, och appen säger det.
   **AI**: en app med egen server på Shipholm får AI utan egen nyckel med verktyget enable_ai (skill
   shipholm-ai). Skriv i appen att barnet pratar med en AI, fråga aldrig efter namn, och visa ett vänligt
   besked när dagens AI är slut (402). Guidens avsnitt `barnet`.
7. **Det som går över nätet** (AI, uppläsning av egen text, taligenkänning) visar ett vänligt besked om
   det inte svarar. Du behöver inte ange det någonstans – `check_app` ser anropen i koden och katalogen
   märker kortet själv ("Använder internet för AI"). Guidens avsnitt `natet`.
8. **Gör det till barnets app**: eget namn, egna färger, en figur eller ett tema barnet valt.
   Material som får användas fritt står i guidens avsnitt `resurser`.
9. **Prova som ett barn**: i webbläsarens enhetsläge 1024 × 768 och 768 × 1024, med bara klick.
   Svara fel med flit – får man en ledtråd och ett nytt försök? Tar en omgång slut?
10. **Kontrollera Kottens hörn** (se nedan) i 1024 × 768, 768 × 1024 och 390 × 844, på varje skärm i
    appen (start, spel, slut). Mät – ögat missar ett kort som bara hamnar i hörnet på mobil.
11. **Gå igenom checklistan** (`get_guide` med `section: "checklista"`).

## Kontrollera Kottens hörn

Kotten är 56 px och sitter 12 px från kanten, innanför `env(safe-area-inset-*)`: uppe till vänster,
eller i hörnet appen valt med `<meta name="skolappar:kotten" content="…">`. Klistra in det här i
webbläsarens konsol på varje skärm och i varje storlek. Det lägger en låtsas-Kotten på rätt plats och
listar allt klickbart som ligger under den:

```js
(() => {
  const corner = document.querySelector('meta[name="skolappar:kotten"]')?.content || 'top-left';
  const W = innerWidth, H = innerHeight, S = 56, E = 12;
  const x0 = corner.endsWith('right') ? W - E - S : E, y0 = corner.startsWith('bottom') ? H - E - S : E;
  const fake = Object.assign(document.createElement('div'), { id: 'fake-kotten' });
  fake.style.cssText = `position:fixed;left:${x0}px;top:${y0}px;width:${S}px;height:${S}px;border-radius:50%;background:#f06a3b99;pointer-events:none;z-index:2147483647`;
  document.querySelector('#fake-kotten')?.remove(); document.body.append(fake);
  const clickable = 'button,a[href],input,select,textarea,label,summary,[role=button],[onclick],[tabindex]:not([tabindex="-1"]),canvas';
  const hits = new Set();
  for (let x = x0 - 8; x <= x0 + S + 8; x += 4) for (let y = y0 - 8; y <= y0 + S + 8; y += 4) {
    for (const el of document.elementsFromPoint(x, y)) { const c = el.closest(clickable); if (c) hits.add(c); }
  }
  const list = [...hits].map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)}"`);
  console.log(`Kotten ${corner}, ${W}×${H}:`, list.length ? list : 'fritt');
  return list;
})();
```

- **Fritt:** bra. En `canvas` i listan betyder att spelplanen går in i hörnet – se till att inget
  spelbart (figurer, mål, knappar som ritas på duken) hamnar där, eller låt spelplanen börja under en
  överrad på minst 80 px.
- **En knapp eller ett kort:** flytta det klickbara (marginal på raden, layout som håller hörnet tomt
  på smala skärmar) – eller välj ett annat hörn med meta-raden, aldrig ett där tummarna styr.
- Har agenten Playwright: kör samma kod med `page.evaluate` i de tre storlekarna och på varje skärm.
- `check_app` säger vilket hörn katalogen läser (`kotten` i svaret), men kan inte se skärmarna.

## Det som oftast går fel

- Appen kräver inloggning eller ligger på en förhandsvisningsadress som bara byggaren kan öppna.
- Knapparna är för små, eller något bygger på hover.
- En knapp där Kotten sitter. På skolappar.org flyter Kotten, Skolappars hemknapp, uppe till vänster
  ovanpå appen. Lämna ungefär 80 × 80 px fritt där, eller välj ett annat hörn med
  `<meta name="skolappar:kotten" content="top-right">` – aldrig där tummarna styr ett spel.
- Sidan zoomar vid dubbeltryck (`touch-action: manipulation` saknas).
- Text på engelska, eller å, ä och ö som blivit fel.
- Ett analysskript följde med från byggverktyget. Ta bort det: ingenting om barnet får lämna enheten.
- En knapp för AI eller uppläsning gör ingenting när tjänsten inte svarar. Säg det vänligt.
- Webbläsarens talsyntes ligger kvar bredvid de inspelade filerna – då låter appen dubbelt eller byter
  röst. Ersätt den helt.
- Appen gör fem saker. Gör en, och gör den bra.

När appen är klar: använd skillen `skolappar-publicera`.
