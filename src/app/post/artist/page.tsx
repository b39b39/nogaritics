import { redirect } from "next/navigation";
import { countries } from "country-flag-icons";
import { getSessionRole, canEdit } from "@/lib/permissions";
import { ArtistPostClient } from "./ArtistPostClient";
import type { CountryItem } from "@/components/post/NationSelectModal";

function getAllCountries(): CountryItem[] {
  const regionNames = new Intl.DisplayNames(["ko"], { type: "region" });
  return countries
    .filter((code) => code.length === 2)
    .map((code) => ({ code, name: regionNames.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export default async function PostArtistPage() {
  const role = await getSessionRole();
  if (!canEdit(role)) redirect("/");
  const countries = getAllCountries();
  return (
    <div className="max-w-4xl mx-auto">
      <ArtistPostClient countries={countries} />
    </div>
  );
}
