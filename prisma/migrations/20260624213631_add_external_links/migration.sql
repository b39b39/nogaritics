-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "soundcloudUrl" TEXT,
ADD COLUMN     "spotifyUrl" TEXT,
ADD COLUMN     "youtubeMusicUrl" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;

-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "soundcloudUrl" TEXT,
ADD COLUMN     "spotifyUrl" TEXT,
ADD COLUMN     "xUrl" TEXT,
ADD COLUMN     "youtubeMusicUrl" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "soundcloudUrl" TEXT,
ADD COLUMN     "spotifyUrl" TEXT,
ADD COLUMN     "youtubeMusicUrl" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;
