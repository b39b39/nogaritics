import type { ArtistRole } from "@prisma/client";

export type { ArtistRole };

export interface ArtistSummary {
  id: string;
  name: string;
  image: string | null;
  nation: string | null;
  isGroup: boolean;
}

export interface ArtistWithRole {
  artist: ArtistSummary;
  role: ArtistRole;
  showInOverview?: boolean;
}

export interface ArtistCredit {
  artist: ArtistSummary;
  role: ArtistRole;
  note: string | null;
  showInOverview: boolean;
}

export interface SelectedAlbum {
  id: string | null;
  name: string;
  image: string | null;
  itunesAlbumId?: string;
  appleMusicUrl?: string | null;
}

export interface SelectedTrack {
  id: string | null;
  name: string;
  image: string | null;
  artistDisplay: string;
  itunesTrackId?: string;
  itunesArtistId?: string;
  appleMusicUrl?: string | null;
}

export interface TagSummary {
  id: string;
  name: string;
}

export interface TrackSummary {
  id: string;
  name: string;
  aliases: string[];
  image: string | null;
  publishedYear: number | null;
  publishedMonth: number | null;
  publishedDay: number | null;
  createdAt: Date;
  artists: ArtistWithRole[];
  album: { id: string; name: string; image: string | null } | null;
  tags: TagSummary[];
  avgScore: number | null;
  rateCount: number;
  starCount: number;
  myScore?: number | null;
  myStarred?: boolean;
}

export interface AlbumSummary {
  id: string;
  name: string;
  aliases: string[];
  image: string | null;
  publishedYear: number | null;
  publishedMonth: number | null;
  publishedDay: number | null;
  createdAt: Date;
  artists: ArtistWithRole[];
  tags: TagSummary[];
  trackCount: number;
  avgScore: number | null;
  rateCount: number;
  starCount: number;
  myScore?: number | null;
  myStarred?: boolean;
}

export interface ArtistDetail {
  id: string;
  name: string;
  aliases: string[];
  isGroup: boolean;
  nation: string | null;
  image: string | null;
  banner: string | null;
  tags: TagSummary[];
  members: ArtistSummary[];
  groups: ArtistSummary[];
  createdAt: Date;
  updatedAt: Date;
}

export type SortBy = "recently" | "published" | "name" | "type" | "artists" | "score" | "starred";
export type SortOrder = "asc" | "desc";
export type TargetType = "track" | "album" | "both";
export type PageSize = 10 | 30 | 50 | 100;

export interface ChartFilter {
  q?: string;
  targetType?: TargetType;
  artistId?: string;
  artistIds?: string[];
  albumId?: string;
  tagId?: string;
  tagIds?: string[];
  publishedFrom?: string;
  publishedTo?: string;
  nations?: string[];
  tagMode?: "or" | "and";
  userMode?: "or" | "and";
  ratedBy?: string;
  starredBy?: string;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: PageSize;
}

export interface RatePayload {
  targetId: string;
  targetType: "track" | "album";
  score?: number | null;
  comment?: string | null;
  starred?: boolean;
}
