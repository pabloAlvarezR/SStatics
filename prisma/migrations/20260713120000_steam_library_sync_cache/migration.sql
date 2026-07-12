-- CreateTable
CREATE TABLE "SteamLibrarySyncCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gamesJson" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SteamLibrarySyncCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SteamLibrarySyncCache_userId_key" ON "SteamLibrarySyncCache"("userId");

-- AddForeignKey
ALTER TABLE "SteamLibrarySyncCache" ADD CONSTRAINT "SteamLibrarySyncCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
