# Skolappar startmall

A small educational web app with the hard parts already solved, to build your own app from.
Plain HTML, CSS and JavaScript: no build step, no packages, no server. Open `index.html` through
any static web server, or publish the folder as it is.

It follows the build guide at https://www.skolappar.com/bygg:

- iPad first, portrait and landscape; works with mouse and keyboard too
- touch: large buttons, no double-tap zoom, no pull-to-refresh, safe areas
- no account, no tracking, no links out; progress is kept on the device (`localStorage`)
- feedback at once, a hint and another try after a wrong answer, short rounds with a clear end
- difficulty that goes up after three right in a row and down when it is hard
- sound made in the browser (no files), a sound button, the question read aloud in Swedish
- right and wrong shown with a symbol as well as a colour; honours `prefers-reduced-motion`
- title, icon, viewport and a web manifest (can be put on the home screen)

## Make your own app

1. **`tasks.js` is the content.** Replace `APP` (name, text, `storageKey`, round length, levels)
   and `makeTask(level)`. The file says what a task looks like. The example is "Tiokamrater".
2. **`app.js` is the engine.** It usually stays as it is. Change `drawPicture` if your tasks
   need another kind of picture than dots.
3. **`style.css`**: the colours are at the top (`--brand`, `--bg`, …).
4. Change the `<title>` and description in `index.html`, the name in `manifest.webmanifest`
   and the icon in `icon.svg`.

Then check and submit the app over MCP at https://www.skolappar.com/mcp (`check_app`, `submit_app`).

The template is free to use and change, with or without saying where it came from.

## Uppläsning

Frågorna läses upp med inspelade repliker i `ljud/` (en MP3 per replik, gjorda med Shipholms
`speak`, rösten `nst`). Texterna står i `ljud/lines.json`. Byter du innehåll i `tasks.js`: skriv nya
repliker i `lines.json`, gör filerna med `speak` (skill `shipholm-voice`), ladda ner dem till `ljud/`
och sätt `sound`/`hintSound` på uppgifterna. Saknas en fil läser webbläsarens egen röst upp `say` i
stället, så appen fungerar även utan ljudfiler.

Bygger appen meningar av data ("Vilken ordklass är " + ord) ska varje färdig mening ha en egen
replik i `lines.json`, gjord från appens data – inte fragment. Kontrollera att det verkligen låter:
spela appen och se att `ljud/*.mp3` hämtas. Kodsnutten räknar det också, så `app_stats` visar hur
stor del av uppläsningen som är inspelad (`in_app.voice`).

## Internet

Lägger du till något som går över nätet – AI (`api.shipholm.com/ai/<app>`), uppläsning av text
barnet skrivit (`api.shipholm.com/speak`) eller taligenkänning – visa en vänlig rad om det inte
svarar ("Uppläsningen fungerar inte just nu"). Du behöver inte märka appen: `check_app` ser anropen
och katalogen visar "Använder internet för …" på kortet (guidens avsnitt `natet`).
