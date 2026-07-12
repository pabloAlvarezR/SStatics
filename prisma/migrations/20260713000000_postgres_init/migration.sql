-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "personaName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "profileUrl" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bio" TEXT,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT true,
    "defaultView" TEXT NOT NULL DEFAULT 'grid',
    "gridDensity" TEXT NOT NULL DEFAULT 'normal',
    "accentColor" TEXT,
    "showStatsOnProfile" BOOLEAN NOT NULL DEFAULT true,
    "inviteCode" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "appId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imgIconUrl" TEXT,
    "imgLogoUrl" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("appId")
);

-- CreateTable
CREATE TABLE "PlaytimeSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" INTEGER NOT NULL,
    "playtimeMinutes" INTEGER NOT NULL,
    "playtime2weeksMinutes" INTEGER,
    "lastPlayedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captureDate" TEXT NOT NULL,

    CONSTRAINT "PlaytimeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SteamFriendCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendSteamId" TEXT NOT NULL,
    "personaName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SteamFriendCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SteamFriendGameCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendSteamId" TEXT NOT NULL,
    "appId" INTEGER NOT NULL,
    "playtimeMinutes" INTEGER,
    "hasData" BOOLEAN NOT NULL DEFAULT false,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SteamFriendGameCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameScan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" INTEGER NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanDate" TEXT NOT NULL,

    CONSTRAINT "GameScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_steamId_key" ON "User"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");

-- CreateIndex
CREATE INDEX "User_lastSyncAt_idx" ON "User"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlaytimeSnapshot_userId_appId_captureDate_key" ON "PlaytimeSnapshot"("userId", "appId", "captureDate");

-- CreateIndex
CREATE INDEX "PlaytimeSnapshot_userId_playtimeMinutes_idx" ON "PlaytimeSnapshot"("userId", "playtimeMinutes");

-- CreateIndex
CREATE INDEX "PlaytimeSnapshot_userId_appId_capturedAt_idx" ON "PlaytimeSnapshot"("userId", "appId", "capturedAt");

-- CreateIndex
CREATE INDEX "PlaytimeSnapshot_userId_captureDate_idx" ON "PlaytimeSnapshot"("userId", "captureDate");

-- CreateIndex
CREATE UNIQUE INDEX "SteamFriendCache_userId_friendSteamId_key" ON "SteamFriendCache"("userId", "friendSteamId");

-- CreateIndex
CREATE INDEX "SteamFriendCache_userId_fetchedAt_idx" ON "SteamFriendCache"("userId", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SteamFriendGameCache_userId_friendSteamId_appId_key" ON "SteamFriendGameCache"("userId", "friendSteamId", "appId");

-- CreateIndex
CREATE INDEX "SteamFriendGameCache_userId_appId_fetchedAt_idx" ON "SteamFriendGameCache"("userId", "appId", "fetchedAt");

-- CreateIndex
CREATE INDEX "GameScan_userId_scanDate_idx" ON "GameScan"("userId", "scanDate");

-- AddForeignKey
ALTER TABLE "PlaytimeSnapshot" ADD CONSTRAINT "PlaytimeSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaytimeSnapshot" ADD CONSTRAINT "PlaytimeSnapshot_appId_fkey" FOREIGN KEY ("appId") REFERENCES "Game"("appId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SteamFriendCache" ADD CONSTRAINT "SteamFriendCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SteamFriendGameCache" ADD CONSTRAINT "SteamFriendGameCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScan" ADD CONSTRAINT "GameScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
