import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

const Terms = () => {
  return (
    <>
      <title>Allmänna villkor | skolappar.com</title>
      <meta 
        name="description" 
        content="Läs våra allmänna villkor för att publicera och använda pedagogiska appar på skolappar.com." 
      />
      
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav variant="solid" />
        
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
          <article className="space-y-8">
            <p className="text-sm text-muted-foreground">
              Senast uppdaterad: 2024-12-09
            </p>
            
            <h1 className="text-3xl font-bold">Allmänna villkor</h1>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">1. Om skolappar.com</h2>
              <p className="text-muted-foreground leading-relaxed">
                skolappar.com är en kostnadsfri plattform där föräldrar och pedagoger kan dela 
                pedagogiska webbappar de skapat för barn. Genom att använda tjänsten eller 
                publicera en app godkänner du dessa villkor.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">2. Ansvar för innehåll</h2>
              <p className="text-muted-foreground leading-relaxed">
                skolappar.com är en <strong className="text-foreground">katalog- och listningsplattform</strong> och är 
                inte ansvarig utgivare för de appar som publiceras. Upphovsmannen är ensamt 
                ansvarig för appens innehåll, funktion och efterlevnad av gällande lagar.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Appen förblir upphovsmannens egendom. Genom att publicera på skolappar.com 
                ger du oss rätt att visa och marknadsföra appen på plattformen.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">3. Granskningsprocess</h2>
              <p className="text-muted-foreground leading-relaxed">
                När en app skickas in genomgår den en manuell granskning innan publicering. 
                Vi kontrollerar:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                <li>Att språkbruket är lämpligt för barn</li>
                <li>Att innehållet är lämpligt och pedagogiskt</li>
                <li>Att appen följer rimlig åldersanpassning (PEGI-principer)</li>
                <li>Att upphovsmannens namn framgår tydligt i appen</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                En app måste klara granskningen för att publiceras i katalogen.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">4. Upphovsmannens skyldigheter</h2>
              <p className="text-muted-foreground leading-relaxed">
                Som upphovsman ansvarar du för att:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                <li>Du har rättigheter till allt innehåll i appen (bilder, ljud, text)</li>
                <li>Appen följer svenska lagar och regler</li>
                <li><strong className="text-foreground">Ditt namn eller pseudonym framgår tydligt i appen</strong></li>
                <li>Innehållet är lämpligt för barn i angiven åldersgrupp</li>
                <li>Appen inte innehåller reklam, skadlig kod eller olämpligt material</li>
                <li>Du uppdaterar appen om den slutar fungera eller behöver korrigeras</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">5. Ansvarsbegränsning</h2>
              <p className="text-muted-foreground leading-relaxed">
                skolappar.com tar <strong className="text-foreground">inget ansvar</strong> för:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                <li>Appars funktion, tillgänglighet eller kvalitet</li>
                <li>Ändringar i appar som sker efter publicering</li>
                <li>Eventuella skador eller förluster av att använda länkade appar</li>
                <li>Att appar upphör att fungera eller tas bort av upphovsmannen</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Användare nyttjar apparna på egen risk. Appar kan ändras av upphovsmannen 
                utan förvarning.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">6. Rapportera olämpligt innehåll</h2>
              <p className="text-muted-foreground leading-relaxed">
                Om du upptäcker en app med olämpligt innehåll, vänligen meddela oss via 
                e-post till{" "}
                <a 
                  href="mailto:info@skolappar.com" 
                  className="text-primary hover:underline"
                >
                  info@skolappar.com
                </a>
                .
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Vi granskar alla anmälningar och tar bort appar som bekräftas innehålla 
                olämpligt material.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">7. Borttagning av appar</h2>
              <p className="text-muted-foreground leading-relaxed">
                skolappar.com förbehåller sig rätten att när som helst ta bort appar som:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                <li>Bryter mot dessa villkor</li>
                <li>Innehåller olämpligt material för barn</li>
                <li>Inte längre fungerar eller är tillgängliga</li>
                <li>Rapporteras och bedöms olämpliga efter granskning</li>
                <li>Saknar tydlig upphovsangivelse</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">8. Personuppgifter</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi behandlar personuppgifter i enlighet med GDPR. Vi sparar endast de 
                uppgifter som krävs för att driva tjänsten (e-post, visningsnamn). 
                Kontakta oss på{" "}
                <a 
                  href="mailto:info@skolappar.com" 
                  className="text-primary hover:underline"
                >
                  info@skolappar.com
                </a>
                {" "}för frågor om personuppgifter.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">9. Ändringar i villkoren</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dessa villkor kan uppdateras. Vid väsentliga ändringar informerar vi 
                registrerade användare via e-post. Fortsatt användning av tjänsten 
                efter ändringar innebär godkännande av de nya villkoren.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">10. Kontakt</h2>
              <p className="text-muted-foreground leading-relaxed">
                Har du frågor om dessa villkor? Kontakta oss på{" "}
                <a 
                  href="mailto:info@skolappar.com" 
                  className="text-primary hover:underline"
                >
                  info@skolappar.com
                </a>
              </p>
            </section>
          </article>
        </main>
        
        <PublicFooter />
      </div>
    </>
  );
};

export default Terms;