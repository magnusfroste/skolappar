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
    appen (start, spel, slut). Hörnet ska vara helt tomt, inte bara fritt från knappar. Mät – ögat
    missar en rubrik som bara hamnar i hörnet på mobil.
11. **Gå igenom checklistan** (`get_guide` med `section: "checklista"`).

## Kontrollera Kottens hörn

Kotten är 56 px och sitter 12 px från kanten, innanför `env(safe-area-inset-*)`: uppe till vänster,
eller i hörnet appen valt med `<meta name="skolappar:kotten" content="…">`. **De 80 × 80 px närmast
hörnet ska vara helt tomma** – ingen rubrik, logga, text, bild, ikon, poäng, förloppsstapel eller knapp,
bara bakgrund. Det som ligger där hamnar under Kotten, också om det inte går att trycka på.

Klistra in det här i webbläsarens konsol på varje skärm (start, spel, slut) och i varje storlek. Det
ritar Kottens yta och listar allt som syns i den:

```js
(() => {
  const corner = document.querySelector('meta[name="skolappar:kotten"]')?.content || 'top-left';
  const W = innerWidth, H = innerHeight, Z = 80;
  const zx = corner.endsWith('right') ? W - Z : 0, zy = corner.startsWith('bottom') ? H - Z : 0;
  const inZone = (r) => r.width > 0 && r.height > 0 && r.right > zx && r.left < zx + Z && r.bottom > zy && r.top < zy + Z;
  const shown = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false; } return true; };
  const big = (r) => r.width * r.height > W * H * 0.5;
  // a game board: is anything drawn in the corner? Sharp edges (a figure, a text) count; an even colour
  // or a soft gradient is background
  const drawn = (cv, r) => {
    try {
      const sx = cv.width / r.width, sy = cv.height / r.height;
      const x = Math.max(zx, r.left), y = Math.max(zy, r.top), w = Math.min(zx + Z, r.right) - x, h = Math.min(zy + Z, r.bottom) - y;
      const t = Object.assign(document.createElement('canvas'), { width: Math.round(w), height: Math.round(h) });
      const g = t.getContext('2d'); g.drawImage(cv, (x - r.left) * sx, (y - r.top) * sy, w * sx, h * sy, 0, 0, t.width, t.height);
      const px = g.getImageData(0, 0, t.width, t.height).data; let edges = 0;
      for (let i = 4; i < px.length; i += 4) if (Math.abs(px[i] - px[i - 4]) + Math.abs(px[i + 1] - px[i - 3]) + Math.abs(px[i + 2] - px[i - 2]) > 90) edges++;
      return edges > px.length / 4 * 0.01 ? 'ritat på spelplanen (canvas)' : null;
    } catch { return 'spelplan (canvas) som inte gick att läsa – titta själv'; }
  };
  const hits = new Map();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode());) {
    if (!n.textContent.trim() || !shown(n.parentElement)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    if ([...r.getClientRects()].some(inZone)) hits.set(n.parentElement, 'text');
  }
  for (const el of document.querySelectorAll('img,svg,video,canvas,button,a[href],input,select,textarea,[role=button],[role=progressbar],[onclick]')) {
    if (el.closest('#fake-kotten') || (el.ownerSVGElement && el.tagName !== 'svg') || !shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (!inZone(r)) continue;
    if (el.matches('canvas')) { const d = drawn(el, r); if (d) hits.set(el, d); continue; }
    hits.set(el, big(r) ? 'bakgrundsbild' : el.matches('img,svg,video') ? 'bild' : 'knapp/stapel');
  }
  const fake = Object.assign(document.createElement('div'), { id: 'fake-kotten' });
  fake.style.cssText = `position:fixed;left:${zx}px;top:${zy}px;width:${Z}px;height:${Z}px;outline:2px dashed #f06a3b;background:#f06a3b33;pointer-events:none;z-index:2147483647`;
  document.querySelector('#fake-kotten')?.remove(); document.body.append(fake);
  const list = [...hits].map(([el, what]) => `${what}: ${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.getAttribute('aria-label') || el.getAttribute('alt') || el.textContent || '').trim().slice(0, 40)}"`);
  console.log(`Kottens hörn ${corner}, ${W}×${H}:`, list.length ? list : 'tomt');
  return list;
})();
```

- **Tomt:** bra.
- **text, bild, knapp/stapel:** flytta det. Ge raden högst upp plats, till exempel
  `padding-left: calc(88px + env(safe-area-inset-left))`, eller låt innehållet börja 80 px ner. Gäller
  också rubriken och appens logga. Behöver appen hörnet: välj ett annat med meta-raden – aldrig ett där
  tummarna styr.
- **bakgrundsbild:** en bild som täcker skärmen är bakgrund och går bra, så länge inget i den som barnet
  ska se (en figur, en text i bilden) ligger i hörnet.
- **ritat på spelplanen (canvas):** något på spelplanen (en figur, en text, en knapp som ritas på duken)
  ligger i hörnet. Flytta det, eller låt spelplanen börja under en överrad på minst 80 px. Mät också
  mitt i spelet: en figur som rör sig kan hamna där senare. En tom spelplan i hörnet går bra.
- Har agenten Playwright: kör samma kod med `page.evaluate` i de tre storlekarna och på varje skärm.
- `check_app` säger vilket hörn katalogen läser (`kotten` i svaret), men kan inte se skärmarna.

## Det som oftast går fel

- Appen kräver inloggning eller ligger på en förhandsvisningsadress som bara byggaren kan öppna.
- Knapparna är för små, eller något bygger på hover.
- Något där Kotten sitter – en rubrik, en logga, en stapel eller en knapp. På skolappar.org flyter
  Kotten, Skolappars hemknapp, uppe till vänster ovanpå appen. De 80 × 80 px där ska vara helt tomma,
  eller välj ett annat hörn med
  `<meta name="skolappar:kotten" content="top-right">` – aldrig där tummarna styr ett spel.
- Sidan zoomar vid dubbeltryck (`touch-action: manipulation` saknas).
- Text på engelska, eller å, ä och ö som blivit fel.
- Ett analysskript följde med från byggverktyget. Ta bort det: ingenting om barnet får lämna enheten.
- En knapp för AI eller uppläsning gör ingenting när tjänsten inte svarar. Säg det vänligt.
- Webbläsarens talsyntes ligger kvar bredvid de inspelade filerna – då låter appen dubbelt eller byter
  röst. Ersätt den helt.
- Appen gör fem saker. Gör en, och gör den bra.

När appen är klar: använd skillen `skolappar-publicera`.
