---
name: skolappar-bygg
description: Bygg en pedagogisk webbapp för barn (en "skolapp") som fungerar på iPad och blir godkänd på skolappar.com. Använd när någon vill göra ett lärospel eller en övningsapp åt ett barn, ensam eller tillsammans med barnet.
---

# Bygg en skolapp

En skolapp tränar **en** sak, startar direkt utan konto och går att spela med bara fingret på en iPad.
Skolappar.com har en guide för vad som krävs och en startmall där det svåra redan är löst.

Anslut till `https://www.skolappar.com/mcp` (MCP över HTTP, ingen nyckel). Finns ingen MCP: samma
innehåll ligger på `https://www.skolappar.com/guide.md` och `https://www.skolappar.com/starter/`.

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
5. **Lägg in kodsnutten** (startmallen har den): en rad `<script src="https://www.skolappar.com/kotten.js" defer>`
   och `skolappar.event('level', n)` när barnet når en nivå, `skolappar.event('round_start')` och `skolappar.event('round_done', procent)` runt en omgång.
   Då visar `app_stats` hur långt barnen kommer och var de slutar – anonymt. Guidens avsnitt `kodsnutten`.
6. **Ge appen en röst**: det appen säger varje gång (frågor, beröm) blir inspelade repliker – Shipholms
   verktyg speak gör MP3-filer med en svensk röst, gratis (skill shipholm-voice). Ladda ner dem till
   appen; webbläsarens röst läser resten. Guidens avsnitt `resurser`.
   **Bilder**: Shipholms verktyg draw ritar illustrationer som SVG i en och samma bilderboksstil
   (skill shipholm-draw) – figurer, djur, saker att räkna. En läsapp kan låta barnet läsa högt och
   kontrollera orden med Shipholms taligenkänning (skill shipholm-listen); inget sparas, och appen säger det.
7. **Gör det till barnets app**: eget namn, egna färger, en figur eller ett tema barnet valt.
   Material som får användas fritt står i guidens avsnitt `resurser`.
8. **Prova som ett barn**: i webbläsarens enhetsläge 1024 × 768 och 768 × 1024, med bara klick.
   Svara fel med flit – får man en ledtråd och ett nytt försök? Tar en omgång slut?
9. **Gå igenom checklistan** (`get_guide` med `section: "checklista"`).

## Det som oftast går fel

- Appen kräver inloggning eller ligger på en förhandsvisningsadress som bara byggaren kan öppna.
- Knapparna är för små, eller något bygger på hover.
- Sidan zoomar vid dubbeltryck (`touch-action: manipulation` saknas).
- Text på engelska, eller å, ä och ö som blivit fel.
- Ett analysskript följde med från byggverktyget. Ta bort det: ingenting om barnet får lämna enheten.
- Appen gör fem saker. Gör en, och gör den bra.

När appen är klar: använd skillen `skolappar-publicera`.
