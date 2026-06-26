const PLATFORMS: { key: string; icon: string; label: string }[] = [
  {
    key: "youtubeUrl",
    icon: "https://www.svgrepo.com/show/475700/youtube-color.svg",
    label: "YouTube",
  },
  {
    key: "youtubeMusicUrl",
    icon: "https://www.svgrepo.com/show/343535/youtube-music-song-multimedia-audio.svg",
    label: "YouTube Music",
  },
  {
    key: "appleMusicUrl",
    icon: "https://www.svgrepo.com/show/349299/apple-music.svg",
    label: "Apple Music",
  },
  {
    key: "soundcloudUrl",
    icon: "https://www.svgrepo.com/show/475683/soundcloud-color.svg",
    label: "SoundCloud",
  },
  {
    key: "xUrl",
    icon: "https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png",
    label: "X (Twitter)",
  },
  {
    key: "instagramUrl",
    icon: "https://www.svgrepo.com/show/452229/instagram-1.svg",
    label: "Instagram",
  },
];

interface Props {
  links: Partial<Record<string, string | null>>;
}

export function ExternalLinks({ links }: Props) {
  const active = PLATFORMS.filter((p) => links[p.key]);
  if (active.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {active.map((p) => (
        <a
          key={p.key}
          href={links[p.key]!}
          target="_blank"
          rel="noopener noreferrer"
          title={p.label}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.icon} alt={p.label} width={22} height={22} />
        </a>
      ))}
    </div>
  );
}
