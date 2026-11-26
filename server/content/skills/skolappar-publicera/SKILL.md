---
name: skolappar-publicera
description: Lägg ut en färdig skolapp på en egen adress, kontrollera den och skicka in den till katalogen på skolappar.org – och följ sedan hur den används. Använd när en pedagogisk app för barn är byggd och ska publiceras eller delas.
---

# Publicera en skolapp

Allt går över MCP på `https://www.skolappar.org/mcp`, utan nyckel och utan konto.
Föräldern behöver bara klicka på en länk i ett mejl.

## 1. Lägg ut appen på en egen https-adress

Appen måste gå att öppna av vem som helst, utan inloggning. Alla värdar fungerar: Shipholm,
Vercel, Netlify, GitHub Pages, Cloudflare Pages, Lovable eller AI Studio (den publicerade adressen,
inte förhandsvisningen). En statisk app – HTML, CSS och JavaScript – räcker nästan alltid.

Har appen ingen adress än är Shipholm enklast: `publish_on_shipholm` ger stegen. Föräldern
godkänner i webbläsaren (ingen nyckel att kopiera), appen får `<namn>.shipholm.dev` direkt och
`<namn>.skolappar.org` när den har godkänts i katalogen.

## 2. Kontrollera

`check_app` med adressen. Rätta allt som är `fail` och kör igen; ta `warn` på allvar.
Kontrollen spelar inte appen – prova själv på iPad-storlek också.

## 3. Skicka in

1. Välj exakt ett ämne (`matte`, `sprak`, `stem`, `samhalle`, `kreativt`), en årskurs (`fs`, `fk-2`,
   `3-6`, `7-9`) och en typ (`spel`, `ova`, `verktyg`), gärna enhet (`tablet`, `desktop`, `mobile`,
   `all-devices`). De skickas som ord i `submit_app` (`subject`, `age`, `app_type`, `device`);
   `list_categories` behövs bara om du vill se beskrivningarna.
2. `list_apps` med sökning – finns appen redan?
3. Fråga föräldern om **förnamn** och **e-postadress**. Gissa aldrig, och använd inte barnets namn.
   Visa **villkoren** (https://www.skolappar.org/villkor, eller `get_terms`) och fråga om föräldern
   godkänner dem. Först när föräldern sagt ja skickar du `accept_terms: true`.
4. Osäker på något? Kör `submit_app` först med `dry_run: true` – svaret säger vad som skulle hända
   (kategorier, läroplan, intyg, kontrollen) och inget sparas eller mejlas.
5. `submit_app` med adress, namn (två till fyra ord), kort beskrivning, kategorier, förnamn och
   e-post. Ange i `curriculum_ids` de punkter i Lgr22 som appen tränar (id från `get_curriculum`),
   och skriv i `long_description` hur appen fungerar.
   Står det `unknown_curriculum_ids` i svaret är appen inskickad ändå: välj bland
   `curriculum_suggestions` och rätta med `update_my_app` (`curriculum_ids`).
   Ligger appen på Shipholm och har kontot en verifierad e-postadress (inloggning med e-post eller
   Google): hämta ett intyg med Shipholms `app_attestation(app)` och skicka det som
   `shipholm_attestation` – samma e-postadress och appens adress – så behövs inget bekräftelsemejl.
6. **Spara `app_key`** ur svaret där du kan hitta den igen (till exempel i projektets anteckningar,
   inte i appens kod). Den visas en gång och är det enda som låter dig ändra eller dra tillbaka appen.
7. Sätt kortbilden – se skillen `skolappar-kortbild`.
8. Säg till föräldern: "Du har fått ett mejl från Skolappar. Klicka på länken, annars publiceras
   inte appen."

## 4. Följ upp

- `app_status` – appar granskas en gång om dagen. `rejected` har ett skäl: rätta, uppdatera med
  `update_my_app`, så ställs appen i kö igen.
- `app_stats` när appen är publicerad – berätta för barnet hur många gånger den har öppnats och
  hur den ligger till i sitt ämne. Med kodsnutten finns även fältet in_app: hur långt barnen kommer, på vilken nivå
  de slutar och hur många omgångar som blir klara – underlag för nästa version.
- Själva appen på sin adress kan du förbättra när som helst, utan att fråga skolappar.
- Ska katalogens text, kategorier eller kortbild ändras på en publicerad app: `update_my_app` eller
  `set_my_app_image`. Ändringen granskas först; den publicerade versionen ligger kvar tills dess.
  `app_status` visar `change`, och skälet om ändringen inte godkändes.
- Tappad `app_key`: `recover_app_keys` med förälderns e-post. Föräldern får en länk och ger dig
  den nya nyckeln.
