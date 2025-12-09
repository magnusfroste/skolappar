import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

const Privacy = () => {
  return (
    <>
      <title>Integritetspolicy | skolappar.com</title>
      <meta 
        name="description" 
        content="Läs om hur skolappar.com hanterar och skyddar dina personuppgifter i enlighet med GDPR." 
      />
      
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav variant="solid" />
        
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
          <article className="space-y-8">
            <p className="text-sm text-muted-foreground">
              Senast uppdaterad: 2024-12-09
            </p>
            
            <h1 className="text-3xl font-bold">Integritetspolicy</h1>
            
            <p className="text-muted-foreground leading-relaxed">
              Din integritet är viktig för oss. Denna policy beskriver hur skolappar.com 
              samlar in, använder och skyddar dina personuppgifter i enlighet med 
              EU:s dataskyddsförordning (GDPR).
            </p>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">1. Personuppgiftsansvarig</h2>
              <p className="text-muted-foreground leading-relaxed">
                skolappar.com är personuppgiftsansvarig för behandlingen av dina 
                personuppgifter på denna plattform.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Kontakt:{" "}
                <a 
                  href="mailto:info@skolappar.com" 
                  className="text-primary hover:underline"
                >
                  info@skolappar.com
                </a>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">2. Vilka uppgifter vi samlar in</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi samlar in följande personuppgifter:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                <li><strong className="text-foreground">E-postadress</strong> – för inloggning och kommunikation</li>
                <li><strong className="text-foreground">Visningsnamn</strong> – för att visa vem som skapat appar</li>
                <li><strong className="text-foreground">Profilbild</strong> (frivilligt) – för din offentliga profil</li>
                <li><strong className="text-foreground">Inskickade appar</strong> – titel, beskrivning, URL och kategorier</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">3. Hur vi använder uppgifterna</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi använder dina personuppgifter för att:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                <li>Möjliggöra inloggning och hantering av ditt konto</li>
                <li>Visa ditt namn som upphovsman till appar du publicerat</li>
                <li>Skicka notifikationer om dina appar (kommentarer, gillningar)</li>
                <li>Kontakta dig vid frågor om dina appar eller ditt konto</li>
                <li>Förbättra och utveckla plattformen</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">4. Rättslig grund</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi behandlar dina personuppgifter baserat på:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                <li><strong className="text-foreground">Avtal</strong> – för att tillhandahålla tjänsten du registrerat dig för</li>
                <li><strong className="text-foreground">Berättigat intresse</strong> – för att förbättra plattformen och förhindra missbruk</li>
                <li><strong className="text-foreground">Samtycke</strong> – för frivilliga funktioner som profilbild</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">5. Lagring och säkerhet</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dina uppgifter lagras säkert hos vår tekniska leverantör inom EU/EES. 
                Vi använder kryptering och säkra anslutningar för att skydda dina data.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Vi behåller dina uppgifter så länge ditt konto är aktivt. Om du raderar 
                ditt konto tas dina personuppgifter bort inom 30 dagar.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">6. Delning med tredje part</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi säljer aldrig dina personuppgifter. Vi delar endast uppgifter med:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                <li>Tekniska leverantörer som hjälper oss driva plattformen (hosting, databas)</li>
                <li>Myndigheter om vi är skyldiga enligt lag</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">7. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi använder endast nödvändiga cookies för att hantera din inloggning 
                och säkerställa att plattformen fungerar korrekt. Vi använder inga 
                spårnings- eller reklamcookies.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">8. Dina rättigheter</h2>
              <p className="text-muted-foreground leading-relaxed">
                Enligt GDPR har du rätt att:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
                <li><strong className="text-foreground">Få tillgång</strong> till dina personuppgifter</li>
                <li><strong className="text-foreground">Rätta</strong> felaktiga uppgifter</li>
                <li><strong className="text-foreground">Radera</strong> dina uppgifter ("rätten att bli glömd")</li>
                <li><strong className="text-foreground">Begränsa</strong> behandlingen av dina uppgifter</li>
                <li><strong className="text-foreground">Invända</strong> mot behandling baserad på berättigat intresse</li>
                <li><strong className="text-foreground">Dataportabilitet</strong> – få ut dina uppgifter i maskinläsbart format</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                För att utöva dina rättigheter, kontakta oss på{" "}
                <a 
                  href="mailto:info@skolappar.com" 
                  className="text-primary hover:underline"
                >
                  info@skolappar.com
                </a>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">9. Klagomål</h2>
              <p className="text-muted-foreground leading-relaxed">
                Om du är missnöjd med hur vi hanterar dina personuppgifter har du rätt 
                att lämna klagomål till{" "}
                <a 
                  href="https://www.imy.se" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Integritetsskyddsmyndigheten (IMY)
                </a>
                .
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">10. Ändringar</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi kan uppdatera denna policy vid behov. Väsentliga ändringar meddelas 
                via e-post till registrerade användare.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">11. Kontakt</h2>
              <p className="text-muted-foreground leading-relaxed">
                Har du frågor om denna integritetspolicy? Kontakta oss på{" "}
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

export default Privacy;