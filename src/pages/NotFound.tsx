import { Link } from "react-router-dom";
import { Kotten } from "@/components/Kotten";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="text-center">
      <Kotten mood="forsok" attribute={false} className="mx-auto h-36 w-36" title="Kotten hittar inte sidan" />
      <h1 className="mt-4 mb-2 text-3xl font-bold font-heading">Den sidan finns inte</h1>
      <p className="mb-6 text-muted-foreground">Kotten har letat, men här finns ingenting.</p>
      <Button asChild><Link to="/">Till startsidan</Link></Button>
    </div>
  </div>
);

export default NotFound;
