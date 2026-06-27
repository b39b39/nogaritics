export interface ItunesTrack {
  wrapperType: "track";
  kind: "song";
  artistId: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  trackViewUrl: string;
  artworkUrl100: string;
  releaseDate: string;
  trackNumber: number;
  trackCount: number;
}

export interface ItunesAlbum {
  wrapperType: "collection";
  artistId: number;
  collectionId: number;
  artistName: string;
  collectionName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  artworkUrl100: string;
  releaseDate: string;
  trackCount: number;
}

export interface ItunesArtist {
  wrapperType: "artist";
  artistId: number;
  artistName: string;
  artistViewUrl: string;
}

export function artworkHQ(url: string): string {
  return url.replace(/\d+x\d+bb/, "1000x1000bb");
}

export function parseItunesDate(releaseDate: string) {
  const d = new Date(releaseDate);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

const ITUNES = "https://itunes.apple.com";

async function itunesFetch(path: "search" | "lookup", params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${ITUNES}/${path}?${qs}`);
  if (!res.ok) throw new Error("iTunes API 오류");
  return res.json();
}

export async function itunesSearchTracks(term: string, limit = 15): Promise<ItunesTrack[]> {
  const data = await itunesFetch("search", { term, entity: "song", country: "kr", limit: String(limit) });
  return (data.results ?? []).filter((r: ItunesTrack) => r.wrapperType === "track" && r.kind === "song");
}

export async function itunesSearchAlbums(term: string, limit = 15): Promise<ItunesAlbum[]> {
  const data = await itunesFetch("search", { term, entity: "album", country: "kr", limit: String(limit) });
  return (data.results ?? []).filter((r: ItunesAlbum) => r.wrapperType === "collection");
}

export async function itunesSearchArtists(term: string, limit = 15): Promise<ItunesArtist[]> {
  const data = await itunesFetch("search", { term, entity: "musicArtist", country: "kr", limit: String(limit) });
  return (data.results ?? []).filter((r: ItunesArtist) => r.wrapperType === "artist");
}

export async function itunesLookupAlbumTracks(collectionId: number): Promise<{ album: ItunesAlbum; tracks: ItunesTrack[] }> {
  for (const country of ["kr", "jp", "us"]) {
    const data = await itunesFetch("lookup", { id: String(collectionId), entity: "song", country });
    const album = (data.results ?? []).find((r: ItunesAlbum) => r.wrapperType === "collection");
    const tracks = (data.results ?? [])
      .filter((r: ItunesTrack) => r.wrapperType === "track" && r.kind === "song")
      .sort((a: ItunesTrack, b: ItunesTrack) => a.trackNumber - b.trackNumber);
    if (tracks.length > 0) return { album, tracks };
  }
  const data = await itunesFetch("lookup", { id: String(collectionId), entity: "song", country: "kr" });
  const album = (data.results ?? []).find((r: ItunesAlbum) => r.wrapperType === "collection");
  return { album, tracks: [] };
}
