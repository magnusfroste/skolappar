// "Så bygger du en skolapp": the one guide that parents read on the site (/bygg) and agents read
// over MCP (get_guide), as /guide.md and from llms.txt. Edit it here and nowhere else.

/** What a card image should look like; also used in the MCP tools that set an image. */
export const IMAGE_HINT =
  'Bild som visas på app-korten: ett ögonblick inifrån själva spelet, inzoomat på spelytan – till exempel roboten vid äpplet, ' +
  'pianotangenterna eller hjulet som snurrar. Liggande 4:3, minst 1200×900 px, motivet centrerat. ' +
  'INTE startsidan, INTE en ▶ Spela-skärm, ingen meny eller navigationsrad, ingen webbläsarram och ingen text som blir oläslig på kortet. ' +
  'Lägg INTE in appens namn, årskurs eller kategori i bilden. Rita ingen ram eller bakgrund runt bilden: kortet lägger själv en ram i ämnets färg. ' +
  'Utelämnas bilden får kortet ämnets färg och symbol.';

export const GUIDE_TITLE = 'Så bygger du en skolapp';
export const GUIDE_INTRO =
  'En skolapp är en liten webbapp som tränar en sak och som ett barn kan börja använda direkt, utan konto och utan hjälp. ' +
  'Den här guiden är till för dig som bygger – själv, med ditt barn eller med en AI-agent. Följer appen guiden fungerar den ' +
  'för barnen som spelar, och den blir godkänd på skolappar.org.';

/** Sections in reading order. `id` is what get_guide takes; `body` is Markdown without a heading. */
export const GUIDE_SECTIONS = [
  {
    id: 'ide',
    title: 'Idén: en sak per app',
    body: `- Välj **ett** tydligt mål, till exempel "öva tiokamrater" eller "känna igen klockslag". En app som gör en sak bra slår en som gör fem saker halvbra.
- Bestäm **ämne och årskurs** innan du bygger. Det styr språk, svårighet och hur mycket text som får finnas.
- Utgå gärna från barnets egen idé. Saknas en idé finns en lista på skolappar.org/ideer (verktyget \`list_ideas\`) med vad lärare och föräldrar önskar sig.
- Se efter i katalogen (\`list_apps\`) om något liknande redan finns, och gör då något eget av det.`,
  },
  {
    id: 'enheter',
    title: 'Enheter: iPad först',
    body: `- De flesta barn spelar på **iPad**. Appen ska fungera där först, både liggande och stående.
- Den ska också fungera på **dator** med mus och tangentbord, och helst på **mobil** om innehållet får plats.
- Låt spelytan fylla skärmen och skala med den. Inga fasta bredder i pixlar, ingen sidledes rullning.
- Allt viktigt ska synas utan att rulla: uppgiften, svarsalternativen och knappen för nästa steg.`,
  },
  {
    id: 'touch',
    title: 'Touch',
    body: `- Tryckytor minst **44 × 44 px**, gärna större för de yngsta, med luft emellan.
- Bygg inget på hover, högerklick eller dubbelklick – det finns inte på en platta.
- Stäng av zoom vid dubbeltryck och dra-för-att-ladda-om på spelytan: \`touch-action: manipulation\` och \`overscroll-behavior: none\`.
- Håll innehållet innanför säkra kanter: \`viewport-fit=cover\` och \`env(safe-area-inset-*)\`.
- Dra-och-släpp ska gå med fingret (pointer events), inte bara med mus. Markera inte text av misstag: \`user-select: none\` på spelytan.
- Ljud startar först efter att barnet tryckt på något. Ha en tydlig knapp för ljud av och på.`,
  },
  {
    id: 'barnet',
    title: 'Barnet: tryggt och utan konto',
    body: `- **Ingen inloggning**, inget konto, ingen e-postadress. Appen startar direkt.
- **Ingen reklam, inga köp** och inga länkar som leder ut ur appen.
- **Samla inte in något** om barnet: inget namn som skickas iväg, ingen spårning, inga analysskript från tredje part.
- Spara framsteg **bara på den egna enheten** (\`localStorage\`). Ett smeknamn som stannar på enheten går bra.
- Ingen chatt och inget innehåll från andra användare.
- Använder appen AI ska nyckeln ligga på en server, aldrig i koden som skickas till webbläsaren, och barnets svar ska inte sparas. En app med egen server på Shipholm får AI utan egen nyckel: verktyget \`enable_ai\` (skill shipholm-ai) ger appen \`OPENAI_API_KEY\`, \`OPENAI_BASE_URL\` och \`OPENAI_MODEL\`, och det räknas av förälderns dagliga Ship credits. Skriv i appen att barnet pratar med en AI, låt AI:n aldrig fråga efter namn eller annat om barnet, och visa ett vänligt besked när dagens AI är slut (svaret 402).
- **Ett undantag: läsappar** får låta barnet läsa högt och kontrollera läsningen med Shipholms taligenkänning (se avsnittet om fria bilder, ljud och typsnitt). Den körs i Sverige, sparar varken ljud eller text och svarar bara vilka ord som hördes. Appen ska säga det där barnet spelar in, och gå att använda utan att spela in.`,
  },
  {
    id: 'pedagogik',
    title: 'Pedagogik',
    body: `- **Direkt återkoppling**: barnet ser genast om svaret var rätt, och vid fel vad det rätta är eller en ledtråd.
- **Få försöka igen** utan straff. Inget ska kunna förloras för gott – inga liv som tar slut, ingen nedräkning som stressar de yngsta.
- **Stigande svårighet**: börja lätt, öka i små steg, och gå tillbaka ett steg när det blir för svårt.
- **Korta omgångar**, fem till tio uppgifter, med ett tydligt slut och en belöning (stjärnor, en animation, ett ljud).
- Slumpa uppgifterna så att appen tål att spelas många gånger.
- **Uppläst text** för dem som inte läser än (förskoleklass till årskurs 2): en högtalarknapp vid varje instruktion, till exempel med webbläsarens talsyntes på svenska.
- Visa framsteg på ett sätt barnet förstår: en stapel som fylls, en samling som växer.`,
  },
  {
    id: 'laroplan',
    title: 'Läroplanen (Lgr22)',
    body: `- Läroplanen för grundskolan, Lgr22, är offentlig. Varje ämne har ett **centralt innehåll** per stadium: årskurs 1–3, 4–6 och 7–9.
- Skolappar har det centrala innehållet som sökbar data från Skolverket: \`get_curriculum\` över MCP. Sök på ämne och stadium, eller på ett ord som "bråk" eller "klockan".
- **Välj en till tre punkter innan du bygger** och håll appen till dem. En app som tränar en punkt bra är mer värd än en som nuddar tio.
- Ange punkternas id som \`curriculum_ids\` när du skickar in. Då står det på appens sida vad den tränar, och lärare och föräldrar hittar den genom läroplanen.
- Skriv också i den långa beskrivningen hur appen tränar just det.
- Skolappars årsgrupper är förskola, FK–2, 3–6 och 7–9. Läroplanens stadier är 1–3, 4–6 och 7–9: en app för FK–2 hör till stadiet 1–3, en app för 3–6 oftast till 4–6. Förskolan har en egen läroplan och inget centralt innehåll att koppla till.`,
  },
  {
    id: 'sprak',
    title: 'Språk',
    body: `- **Svenska**, med riktiga å, ä och ö i all text. Sätt \`<html lang="sv">\`.
- Korta meningar och ord som åldern kan. Hellre en bild eller en symbol än en lång instruktion.
- Tilltala barnet med "du". Uppmuntra utan att överdriva; "Nästan! Prova igen" fungerar bättre än "Fel".
- Tal, datum och enheter skrivs på svenskt vis: decimalkomma, 24-timmarsklocka, kronor.`,
  },
  {
    id: 'tillganglighet',
    title: 'Tillgänglighet',
    body: `- God **kontrast** mellan text och bakgrund, och text som är minst 18 px i spelytan.
- Appen ska gå att använda **utan ljud**, och rätt eller fel ska inte bara visas med färg – lägg till en symbol eller en text.
- Inget som blinkar snabbt. Respektera \`prefers-reduced-motion\`.
- Tydliga, lättlästa typsnitt. Undvik text i versaler och text ovanpå bilder.
- Knappar ska ha namn (\`aria-label\`) så att uppläsning fungerar.`,
  },
  {
    id: 'teknik',
    title: 'Teknik',
    body: `- En **egen adress med https** som fungerar när man öppnar den direkt – inte en förhandsvisning som kräver inloggning hos byggverktyget.
- **Laddar snabbt**: första skärmen inom ett par sekunder på en vanlig platta. Komprimera bilder och ljud, ladda inte ner mer än spelet behöver.
- **En statisk app räcker** nästan alltid: HTML, CSS och JavaScript utan server och utan databas.
- Sidan har en \`<title>\` med appens namn, en ikon och \`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\`.
- Gärna ett webbmanifest med ikon, så att appen går att lägga på hemskärmen.
- Tål dålig uppkoppling: när appen väl är laddad ska den inte behöva nätet för att fungera.
- Publicerar du appen på Shipholm (verktyget publish_site) blir den installerbar och fungerar utan nät av sig själv: Shipholm lägger till det som behövs. Ge den en \`<title>\` och en ikon (\`icon-512.png\`, \`apple-touch-icon.png\` eller \`favicon.svg\`).
- Typsnitt, bilder och ljud ska vara dina egna eller fria att använda (se avsnittet om fria bilder, ljud och typsnitt). Lägg dem i appen i stället för att hämta dem från andra webbplatser.
- Prova på en riktig iPad eller i webbläsarens enhetsläge (1024 × 768 och 768 × 1024) innan du skickar in.`,
  },
  {
    id: 'natet',
    title: 'Internet',
    body: `Appar räknar med internet, som allt annat på webben. Några saker går över nätet varje gång de används – AI, uppläsning av text barnet själv skrivit och taligenkänning – och för dem gäller bara:

- **Ett vänligt besked när det inte svarar.** Ingen uppkoppling, eller "slut för i dag" (HTTP 429, för AI 402): visa en rad som "Uppläsningen fungerar inte just nu", och låt resten av appen fortsätta.

**Katalogen märker appen själv.** Kontrollen (\`check_app\`) läser appens kod och ser när den anropar AI (\`api.shipholm.com/ai/\`, OpenAI, Gemini …), uppläsning (\`api.shipholm.com/speak\`, ElevenLabs …) eller taligenkänning (\`api.shipholm.com/listen\`). Då visar kortet "Använder internet för AI och uppläsning". Ingen behöver fylla i något: märkningen följer koden och uppdateras när appen kontrolleras igen. Kontrollens svar (\`needs_internet\`) säger vad katalogen kommer att visa.`,
  },
  {
    id: 'startmall',
    title: 'Startmallen',
    body: `- Skolappars startmall är en liten färdig app där det svåra redan är löst: touch-inställningarna för iPad, omgångar med återkoppling och ledtråd, stigande svårighet, ljud av och på, uppläsning på svenska, belöning, sparning på enheten, ikon och webbmanifest.
- Prova den på skolappar.org/starter/ och hämta filerna med \`get_starter\`. Den är ren HTML, CSS och JavaScript utan byggsteg.
- Innehållet ligger i \`tasks.js\` och motorn i \`app.js\`. Byt innehållet och låt motorn vara.
- Mallen är fri att använda och ändra. Du behöver den inte – men det den gör ska din app också göra.`,
  },
  {
    id: 'kodsnutten',
    title: 'Kodsnutten: se hur appen används',
    body: `Lägg in en rad i appens \`<head>\`, så får du veta hur appen används – utan att något om barnet lämnar enheten:

\`\`\`html
<script src="https://www.skolappar.org/kotten.js" defer></script>
\`\`\`

- Den räknar själv att appen startas och hur länge den spelas.
- Berätta resten när det händer:
  - \`skolappar.event('round_start')\` – en omgång börjar
  - \`skolappar.event('round_done', 80)\` – en omgång är klar; värdet är resultatet i procent
  - \`skolappar.event('level', 2)\` – barnet når en nivå (1–50). Då ser du hur långt barnen kommer och på vilken nivå de slutar.
  - \`skolappar.event('hint')\` – en ledtråd eller ett nytt försök behövdes
  - \`skolappar.event('sound_off')\` – ljudet stängdes av
- \`app_stats\` visar siffrorna under \`in_app\` för de senaste 30 dagarna: starter, minuter per besök, andel avslutade omgångar, medelresultat och, per nivå, hur många som nådde den och hur många som slutade där.
- **Integritet:** inga cookies, ingen lagring på enheten, inga id:n. Skolappar sparar inte IP-adressen, bara antal och summor per app och dag. Appen känns igen på sin adress, så bara appar i katalogen räknas.
- Appen fungerar som vanligt om skriptet inte laddas. Anropa \`skolappar.event\` med \`window.skolappar?.event(...)\`, så går ingenting sönder.
- Startmallen har kodsnutten redan.`,
  },
  {
    id: 'resurser',
    title: 'Fria bilder, ljud och typsnitt',
    body: `Använd bara material som du gjort själv eller som får användas fritt, och lägg filerna i appen i stället för att länka till dem. Licenser ändras: läs vad som står hos källan innan du använder något, och spara var du tog det.

**Bilder och symboler**
- **Illustrationer från Shipholm**: verktyget draw på Shipholms MCP (skill shipholm-draw) ritar en bild som SVG i en och samma bilderboksstil – mjuka former, få färger, tjock mörk kontur, ingen text och inget läskigt – så att alla bilder i appen hör ihop. Beskriv bilden konkret ("tre röda äpplen i en korg"), ladda ner filen till appen (till exempel \`bilder/apple.svg\`) och titta på den innan du använder den; i ett räknespel ska antalet stämma. Kostar lite av kontots Ship credits; en bild som ritats förut är gratis. Kräver ett Shipholm-konto som verktyget speak nedan.
- **Emoji från systemet**: kräver inga filer och ingen licens, och barn känner igen dem.
- **Egen SVG**: enkla former ritade i koden. Skalar till alla skärmar och väger nästan ingenting.
- **OpenMoji** (openmoji.org): emoji som SVG, CC BY-SA 4.0 – ange källan.
- **Kenney** (kenney.nl): spelgrafik, figurer och gränssnitt, CC0 – fritt utan krav.
- **Lucide** (lucide.dev) och **Tabler Icons** (tabler.io/icons): ikoner med fri licens (ISC respektive MIT).
- **Wikimedia Commons** och **Openverse** (openverse.org): foton och illustrationer. Licensen står vid varje bild; välj CC0 eller CC BY och ange upphovspersonen.

**Ljud**
- **Gör ljuden i webbläsaren** med Web Audio, som startmallen: inga filer, ingen licens, fungerar utan nät.
- **Kenney** (kenney.nl): ljudeffekter för spel, CC0.
- **Freesound** (freesound.org): licensen står vid varje ljud. Välj CC0; undvik ljud märkta NC.
- Håll ljuden korta och lågmälda, och låt appen fungera med ljudet av.

**Typsnitt**
- **Systemets typsnitt** (\`system-ui\`) laddar inget och är lättläst.
- **Google Fonts** (fonts.google.com): de flesta har licensen OFL och får läggas i appen. Ladda ner filerna i stället för att länka, så skickas ingenting om barnet till Google. Lättlästa val: Atkinson Hyperlegible, Lexend, Andika, Nunito.

**Uppläsning på svenska**
- **Inspelade repliker** (bäst för det appen säger varje gång: frågor, instruktioner, beröm): Shipholm gör MP3-filer av text med en svensk röst (Piper, rösten nst – fri att använda), gratis och utan tokens – verktyget speak på Shipholms MCP, skill shipholm-voice. Ladda ner filerna till appen (till exempel \`ljud/fraga-3.mp3\`) och spela dem efter ett tryck; länka aldrig till adressen. Då låter det likadant på alla enheter och fungerar utan nät. Startmallen gör så och har sina repliker i \`ljud/lines.json\`. Verktyget kräver ett gratis Shipholm-konto: ligger appen inte på Shipholm, fråga föräldern om ni ska skaffa ett (\`publish_on_shipholm\` på Skolappars MCP visar hur – föräldern godkänner i webbläsaren). Säger föräldern nej fungerar webbläsarens talsyntes nedan.
- **Hela meningar, också de som byggs av data.** Säger appen \`fråga + ord\` – "Vilken ordklass är *katt*?" – ska varje sådan mening spelas in som en helhet, gjord av appens egna data (ordlistan, frågebanken) när appen byggs. Fragment som pusslas ihop låter fel, och spelar appen inte filen hörs bara webbläsarens röst.
- **Bevis på att det låter:** en fil som finns är inte en fil som spelas. Spela appen i webbläsaren och se att \`ljud/*.mp3\` hämtas, eller titta i \`app_stats\`: kodsnutten räknar själv hur mycket som spelades in (\`in_app.voice.share_recorded\`).
- **Text som inte går att veta i förväg** – en saga barnet skrivit, ett svar från appens AI – läses upp av samma svenska röst medan appen används: \`POST https://api.shipholm.com/speak\` med \`{"text": …}\` ger tillbaka MP3. Ingen nyckel och ingen egen server; bara appens egen adress på Shipholm får anropa den, högst 3 000 tecken per gång (skill shipholm-voice). Den går över nätet – se avsnittet natet.
- **Webbläsarens talsyntes** (\`speechSynthesis\` med \`lang = "sv-SE"\`) som reserv när en fil saknas eller nätet är borta. Rösten finns på enheten och låter olika på olika enheter; på iPad måste den startas av ett tryck.
- Inga personuppgifter i replikerna – barnets namn eller svar ska aldrig skickas för att bli uppläst.
- Vill du ha en alldeles egen röst: spela in själv, gärna med barnet. Det är fritt, och roligare.

**Barnet läser högt (läsappar)**
- Shipholms taligenkänning lyssnar på när barnet läser en rad och svarar vilka ord som hördes: \`https://api.shipholm.com/listen.js\` (ladda ner filen till appen), \`ShipholmListen.start()\` efter ett tryck och \`rec.check(raden)\`. Gratis och utan nyckel, på svenska. Skill shipholm-listen.
- Den körs på en server i Sverige. Ljudet jämförs med raden och kastas direkt – varken ljud eller text sparas, och appen får aldrig veta vad som hördes, bara vilka ord som stämde.
- Det fungerar bara när appen ligger på Shipholm, på sin egen adress.
- Visa texten \`ShipholmListen.notice\` (eller samma sak med egna ord) där barnet spelar in, och ha alltid en väg vidare utan inspelning ("Jag har läst").
- "3" och "tre" räknas lika och ett extra ord på slutet struntar den i, men en fel ändelse ("matta" för "mattan") räknas som fel – det är just läsningen.

**Ord och innehåll**
- Läroplanen (Lgr22) på skolverket.se är offentlig.
- Ordlistor och uppgifter skriver du bäst själv efter årskursen. Hämtar du från Wiktionary gäller CC BY-SA.`,
  },
  {
    id: 'presentation',
    title: 'Presentation i katalogen',
    body: `- **Namn**: två till fyra ord som säger vad appen är, till exempel "Klockjakten" eller "Tiokamrater med roboten".
- **Kort beskrivning**: en eller två meningar om vad man övar på och hur.
- **Lång beskrivning** (valfri): hur appen fungerar, för vilken ålder, och vad i Lgr22 den tränar.
- **Kategorier**: exakt ett ämne, en årskurs och en typ, gärna även enhet. Utan dem syns appen inte i filtren.
- **Kortbild**: ${IMAGE_HINT.replace(/^Bild som visas på app-korten: /, '')}
- Skaparen visas med **förnamn**. Skriv inte barnets fullständiga namn någonstans i appen eller beskrivningen.`,
  },
  {
    id: 'skicka-in',
    title: 'Skicka in appen',
    body: `**Ingen adress än?** Appen kan läggas ut på Shipholm, gratis för små appar och i Europa: \`publish_on_shipholm\` ger stegen. Föräldern godkänner i webbläsaren, och ingen nyckel behöver kopieras. Appen får \`<namn>.shipholm.dev\` direkt och \`<namn>.skolappar.org\` när den har godkänts. Alla andra värdar går lika bra.

**Som förälder:** fyll i formuläret på skolappar.org/tipsa med appens adress och din e-postadress.

**Som agent:** anslut till \`https://www.skolappar.org/mcp\` (MCP över HTTP, ingen nyckel) och gör så här:

1. \`check_app\` – kontrollera adressen mot guiden och rätta det som brister.
2. \`list_apps\` – se att appen inte redan finns.
3. \`submit_app\` – adress, namn, beskrivning, kategorierna med ord (\`subject: "matte"\`, \`age: "fk-2"\`, \`app_type: "spel"\`, gärna \`device\`; \`list_categories\` visar alla), punkterna i Lgr22 (\`curriculum_ids\`) samt förälderns förnamn och e-postadress, och \`accept_terms: true\` när föräldern har läst och godkänt villkoren (\`get_terms\`, /villkor). Ligger appen på Shipholm: hämta först ett intyg med Shipholms \`app_attestation\` och skicka med det som \`shipholm_attestation\` – då behövs inget bekräftelsemejl. Spara \`app_key\` ur svaret; den visas en gång. Osäker? Skicka först med \`dry_run: true\`: svaret säger vad som skulle hända och inget sparas.
4. \`set_my_app_image\` – sätt kortbilden: som SVG, från en adress eller som uppladdad fil. Utan bild får kortet ämnets färg och symbol.
5. Be föräldern klicka på länken i mejlet från Skolappar. Utan det publiceras appen inte.
6. \`app_status\` – appar granskas en gång om dagen. Avslås appen står skälet där; rätta och uppdatera, så ställs den i kö igen.
7. \`app_stats\` – berätta för barnet hur många gånger appen har öppnats, och med kodsnutten hur långt barnen kommer i den. Samma siffror kommer som veckobrev till föräldern varje måndag.`,
  },
  {
    id: 'checklista',
    title: 'Checklista före inskick',
    body: `- [ ] Appen öppnas på sin https-adress utan inloggning.
- Den fungerar på iPad, liggande och stående, med bara fingret.
- Alla knappar är minst 44 px och inget kräver hover eller dubbelklick.
- Sidan zoomar inte vid dubbeltryck och rullar inte i sidled.
- Ingen reklam, inga köp, inga länkar ut, ingen spårning.
- Inget om barnet lämnar enheten (utom läsning som kontrolleras av Shipholms taligenkänning, och appen säger det).
- Barnet får direkt återkoppling och kan alltid försöka igen.
- Svårigheten stiger i små steg och en omgång har ett tydligt slut.
- All text är på svenska med å, ä och ö, och passar åldern.
- Appen går att använda utan ljud och har en ljudknapp.
- AI och uppläsning visar ett vänligt besked om de inte svarar.
- Sidan har titel, ikon och rätt viewport.
- Namn, beskrivning, ämne, årskurs, typ och kortbild är klara.
- Appen är kopplad till en till tre punkter i Lgr22, och beskrivningen säger hur den tränar dem.`,
  },
];

const sectionMarkdown = (s) => `## ${s.title}\n\n${s.body}\n`;

/** The whole guide, or one section, as Markdown. Null for an unknown section. */
export function guideMarkdown(section) {
  if (section) {
    const s = GUIDE_SECTIONS.find((x) => x.id === section);
    return s ? sectionMarkdown(s) : null;
  }
  return `# ${GUIDE_TITLE}\n\n${GUIDE_INTRO}\n\n${GUIDE_SECTIONS.map(sectionMarkdown).join('\n')}`;
}

export const guideSectionIds = () => GUIDE_SECTIONS.map((s) => s.id);

/** What the page and the API return. */
export const guide = () => ({
  title: GUIDE_TITLE,
  intro: GUIDE_INTRO,
  sections: GUIDE_SECTIONS.map(({ id, title, body }) => ({ id, title, body })),
});
