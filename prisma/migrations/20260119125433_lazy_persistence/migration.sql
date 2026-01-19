-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "hasMatchJson" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasTimelineJson" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "matchJson" DROP NOT NULL;
