import { FeaturedCompanyDossier } from "../../FeaturedCompanyDossier";
import { featuredDossiers } from "../../data/featuredDossiers";
import { researchUniverse } from "../../data/universe";

export const dynamic = "force-dynamic";

export default function OndasCompanyPage() {
  const company = researchUniverse.find((candidate) => candidate.ticker === "ONDS");
  const dossier = featuredDossiers.ONDS;
  if (!company || !dossier) throw new Error("ONDS must be registered in the complete dossier universe.");
  return <FeaturedCompanyDossier company={company} dossier={dossier} />;
}
