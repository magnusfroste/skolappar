import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

const FILES: [string, string][] = [
  ["tasks.js", "innehållet – byt ut uppgifterna mot era egna"],
  ["app.js", "motorn: omgångar, återkoppling, svårighet, ljud, uppläsning, belöning"],
  ["index.html", "sidan, med Skolappars kodsnutt"],
  ["style.css", "utseende och touch-inställningar för iPad"],
  ["manifest.webmanifest", "så att appen kan läggas på hemskärmen"],
  ["icon.svg", "ikonen"],
  ["README.md", "hur mallen fungerar"],
];

/** /startmall – the starter template, live (/starter/) and as files. */
export default function StarterDemo() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Startmallen"
        description="En färdig liten skolapp där det svåra redan är löst: touch på iPad, återkoppling, ledtrådar, stigande svårighet, ljud, uppläsning och belöning. Fri att använda – byt innehållet och bygg vidare."
        url="/startmall"
      />
      <PublicNav variant="solid" />
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-heading font-black">Startmallen</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
          En liten färdig skolapp där det svåra redan är löst: touch på iPad, återkoppling och ledtrådar, stigande
          svårighet, ljud av och på, uppläsning på svenska, belöning och sparning på enheten. Ren HTML, CSS och
          JavaScript utan byggsteg. Byt innehållet i <code>tasks.js</code> och låt motorn vara.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-full"><a href="/starter/" target="_blank" rel="noopener">Öppna mallen i en egen flik</a></Button>
          <Button asChild variant="outline" className="rounded-full"><Link to="/bygg">Läs byggguiden</Link></Button>
          <Button asChild variant="outline" className="rounded-full"><Link to="/resurser/lara/bygg-app-med-ditt-barn">Bygg en app med ditt barn</Link></Button>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border shadow-playful">
          <iframe src="/starter/" title="Startmallen – Tiokamrater" className="block h-[560px] w-full" loading="lazy" />
        </div>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-heading font-bold">Filerna</h2>
            <ul className="mt-3 space-y-2">
              {FILES.map(([name, what]) => (
                <li key={name}>
                  <a href={`/starter/${name}`} target="_blank" rel="noopener" className="font-mono underline underline-offset-4 hover:text-primary">{name}</a>
                  <span className="text-muted-foreground"> – {what}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold">Med en AI-agent</h2>
            <p className="mt-3 text-muted-foreground">
              Be agenten ansluta till <code>https://www.skolappar.com/mcp</code> och hämta mallen med verktyget{" "}
              <code>get_starter</code>, läsa guiden med <code>get_guide</code> och sedan bygga barnets idé ovanpå mallen.
              När appen är klar kan agenten kontrollera den med <code>check_app</code> och skicka in den med{" "}
              <code>submit_app</code>.
            </p>
            <p className="mt-3 text-muted-foreground">
              Mallen är fri att använda och ändra. Ni behöver den inte – men det den gör ska er app också göra.
            </p>
          </div>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}
