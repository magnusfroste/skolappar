# Små designförbättringar

## Genomförande
- Lägg en lätt, statisk laddningsvy i startsidans HTML med befintlig logotyp och samma varma bakgrund som appen. React ersätter den automatiskt vid montering.
- Skapa en gemensam reservbild för appkort: skärmdump från appens URL när den finns, annars en färgglad yta med appens initialer.
- Använd reservbilden i vanliga, kompakta, visuella och topplistans appkort.
- Ge röstknappen på bildkort en solid, tydlig bakgrund.
- Ge favoritknappen i mobilgalleriet text och placera kontrollerna kompakt utan att ändra funktion.
- Minska endast mobilavståndet mellan startsidans statistik och topplistan.

## Kontroll
- Kontrollera desktop och mobil så att laddningsvy, reservbilder, knappar och avstånd fungerar utan överlappning.
- Kontrollera att projektet bygger utan fel.

## Teknisk avgränsning
- Endast presentation i frontend och startsidans HTML ändras.
- Ingen databas, inloggning eller administration ändras.
