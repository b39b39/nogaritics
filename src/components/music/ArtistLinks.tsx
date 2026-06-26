import Link from "next/link";
import { Fragment } from "react";
import { ArtistHoverCard } from "./ArtistHoverCard";
import type { ArtistWithRole } from "@/types";

interface Props {
  artists: ArtistWithRole[];
}

export function ArtistLinks({ artists }: Props) {
  return (
    <p className="text-xs text-gray-500 truncate">
      {artists.map((a, i) => (
        <Fragment key={a.artist.id}>
          <ArtistHoverCard artistId={a.artist.id}>
            <Link href={`/artists/${a.artist.id}`} className="relative z-10 hover:text-indigo-600 hover:underline">
              {a.artist.name}
            </Link>
          </ArtistHoverCard>
          {i < artists.length - 1 && ", "}
        </Fragment>
      ))}
    </p>
  );
}
