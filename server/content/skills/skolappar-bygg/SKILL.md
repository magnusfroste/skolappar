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
3. **Välj punkt i läroplanen.** Avsnittet `laroplan` i guiden säger hur. Skriv ner vilken punkt i
   det centrala innehållet (Lgr22) appen tränar; den ska med i beskrivningen.
4. **Utgå från startmallen**: `get_starter` ger filerna. Byt `tasks.js` (innehållet) och låt
   `app.js` (motorn) vara: omgångar, återkoppling, svårighet, ljud, uppläsning och sparning finns redan.
   Bygger du med ett eget ramverk gäller samma krav – gå igenom guidens avsnitt `touch` och `barnet`.
5. **Gör det till barnets app**: eget namn, egna färger, en figur eller ett tema barnet valt.
   Material som får användas fritt står i guidens avsnitt `resurser`.
6. **Prova som ett barn**: i webbläsarens enhetsläge 1024 × 768 och 768 × 1024, med bara klick.
   Svara fel med flit – får man en ledtråd och ett nytt försök? Tar en omgång slut?
7. **Gå igenom checklistan** (`get_guide` med `section: "checklista"`).

## Det som oftast går fel

- Appen kräver inloggning eller ligger på en förhandsvisningsadress som bara byggaren kan öppna.
- Knapparna är för små, eller något bygger på hover.
- Sidan zoomar vid dubbeltryck (`touch-action: manipulation` saknas).
- Text på engelska, eller å, ä och ö som blivit fel.
- Ett analysskript följde med från byggverktyget. Ta bort det: ingenting om barnet får lämna enheten.
- Appen gör fem saker. Gör en, och gör den bra.

När appen är klar: använd skillen `skolappar-publicera`.
