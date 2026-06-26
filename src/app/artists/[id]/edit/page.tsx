import { notFound, redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSessionRole, canEdit } from "@/lib/permissions";
import { tagInclude } from "@/lib/queries";
import { ArtistEditClient } from "./ArtistEditClient";
import type { CountryItem } from "@/components/post/NationSelectModal";

function getAllCountries(): CountryItem[] {
  const dir = path.join(process.cwd(), "node_modules/country-flag-icons/3x2");
  const regionNames = new Intl.DisplayNames(["ko"], { type: "region" });
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".svg"))
    .map((f) => f.replace(".svg", ""))
    .filter((code) => code.length === 2)
    .map((code) => ({ code, name: regionNames.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export default async function ArtistEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getSessionRole();
  if (!canEdit(role)) redirect(`/artists/${id}`);

  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      ...tagInclude,
      memberEntries: {
        include: {
          member: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!artist) notFound();

  const countries = getAllCountries();

  return (
    <div className="max-w-4xl mx-auto">
      <ArtistEditClient
        data={{
          id: artist.id,
          name: artist.name,
          aliases: artist.aliases,
          isGroup: artist.isGroup,
          nation: artist.nation,
          image: artist.image,
          banner: artist.banner,
          tags: artist.tags.map((t) => ({ id: t.tag.id, name: t.tag.name })),
          members: artist.memberEntries.map((e) => ({
            id: e.member.id,
            name: e.member.name,
            image: e.member.image,
          })),
          xUrl: artist.xUrl,
          instagramUrl: artist.instagramUrl,
          youtubeUrl: artist.youtubeUrl,
          youtubeMusicUrl: artist.youtubeMusicUrl,
          appleMusicUrl: artist.appleMusicUrl,
          soundcloudUrl: artist.soundcloudUrl,
        }}
        countries={countries}
      />
    </div>
  );
}
