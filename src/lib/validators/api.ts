import { z } from "zod";

export const syncResponseSchema = z.object({
  success: z.boolean(),
  gamesCount: z.number(),
  syncedAt: z.string().optional(),
  message: z.string().optional(),
  done: z.boolean(),
  processed: z.number().optional(),
  total: z.number().optional(),
});

export const scanUsageSchema = z.object({
  usedToday: z.number(),
  limit: z.number(),
  remaining: z.number(),
  tier: z.string(),
  unlimited: z.boolean(),
});

export const singleGameSyncResponseSchema = z.object({
  success: z.boolean(),
  syncedAt: z.string(),
  gameName: z.string(),
  scansUsedToday: z.number(),
  scansLimit: z.number(),
  scansRemaining: z.number(),
  message: z.string().optional(),
});

export const chartPointSchema = z.object({
  date: z.string(),
  hours: z.number(),
});

export const playtimeProgressSchema = z.object({
  hoursGained: z.number(),
  hoursGainedRecent: z.number(),
  percentChange: z.number().nullable(),
  periodDays: z.number(),
});

export const gameHistorySchema = z.object({
  appId: z.number(),
  name: z.string(),
  imgIconUrl: z.string().nullable(),
  imgLogoUrl: z.string().nullable(),
  totalHours: z.number(),
  lastPlayedAt: z.string().nullable(),
  hasChartData: z.boolean(),
  progress: playtimeProgressSchema.nullable(),
  points: z.array(chartPointSchema),
});

export const libraryGameSchema = z.object({
  appId: z.number(),
  name: z.string(),
  imgIconUrl: z.string().nullable(),
  imgLogoUrl: z.string().nullable(),
  totalHours: z.number(),
  hours2weeks: z.number().nullable(),
  lastPlayedAt: z.string().nullable(),
  hasChartData: z.boolean(),
  progress: playtimeProgressSchema.nullable(),
  sparkline: z.array(chartPointSchema),
});

export const libraryResponseSchema = z.object({
  games: z.array(libraryGameSchema),
  lastSyncAt: z.string().nullable(),
  needsSync: z.boolean(),
});

export const statCardSchema = z.object({
  label: z.string(),
  value: z.string(),
  subValue: z.string().optional(),
  trend: z.number().optional(),
  trendLabel: z.string().optional(),
});

export const topGameSchema = z.object({
  appId: z.number(),
  name: z.string(),
  totalHours: z.number(),
  sparkline: z.array(chartPointSchema),
});

export const percentileSchema = z.object({
  hoursTotal: z.number().nullable(),
  gamesCount: z.number().nullable(),
  hours7d: z.number().nullable(),
  available: z.boolean(),
});

export const statsResponseSchema = z.object({
  totalHours: z.number(),
  totalGames: z.number(),
  gamesWithHours: z.number(),
  gamesUnplayed: z.number(),
  hours48h: z.number(),
  hours7d: z.number(),
  hours14d: z.number(),
  hours30d: z.number(),
  hours2weeksSteam: z.number(),
  avgHoursPerGame: z.number(),
  backlogCount: z.number(),
  activityStreak: z.number(),
  weeklyGrowthPercent: z.number().nullable(),
  topGame: z
    .object({
      appId: z.number(),
      name: z.string(),
      totalHours: z.number(),
    })
    .nullable(),
  recentGame: z
    .object({
      appId: z.number(),
      name: z.string(),
      lastPlayedAt: z.string(),
    })
    .nullable(),
  topGames: z.array(topGameSchema),
  activityHeatmap: z.array(
    z.object({
      date: z.string(),
      hours: z.number(),
    }),
  ),
  percentiles: percentileSchema,
  accountAgeDays: z.number(),
  daysSinceSync: z.number().nullable(),
  platformUserCount: z.number(),
});

export const profileResponseSchema = z.object({
  id: z.string(),
  steamId: z.string(),
  personaName: z.string(),
  avatarUrl: z.string().nullable(),
  profileUrl: z.string().nullable(),
  bio: z.string().nullable(),
  isProfilePublic: z.boolean(),
  defaultView: z.enum(["grid", "list"]),
  gridDensity: z.enum(["compact", "normal", "large"]),
  accentColor: z.string().nullable(),
  showStatsOnProfile: z.boolean(),
  inviteCode: z.string(),
  tier: z.string(),
  createdAt: z.string(),
  lastSyncAt: z.string().nullable(),
});

export const profileUpdateSchema = z.object({
  bio: z.string().max(300).optional(),
  isProfilePublic: z.boolean().optional(),
  defaultView: z.enum(["grid", "list"]).optional(),
  gridDensity: z.enum(["compact", "normal", "large"]).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  showStatsOnProfile: z.boolean().optional(),
});

export const friendSchema = z.object({
  steamId: z.string(),
  personaName: z.string(),
  avatarUrl: z.string().nullable(),
  isOnPlatform: z.boolean(),
  sstaticsUserId: z.string().nullable(),
  sstaticsSteamId: z.string().nullable(),
  totalHours: z.number().nullable(),
  totalGames: z.number().nullable(),
  isProfilePublic: z.boolean().nullable(),
});

export const friendsResponseSchema = z.object({
  friends: z.array(friendSchema),
  lastFetchedAt: z.string().nullable(),
  isPrivate: z.boolean(),
  inviteCode: z.string(),
});

export const gameFriendComparisonSchema = z.object({
  steamId: z.string(),
  personaName: z.string(),
  avatarUrl: z.string().nullable(),
  isOnPlatform: z.boolean(),
  hasGameData: z.boolean(),
  isProfilePublic: z.boolean().nullable(),
  hoursSource: z.enum(["sstatics", "steam"]).nullable(),
  totalHours: z.number().nullable(),
  hasChartData: z.boolean(),
  canCompareOnChart: z.boolean(),
  progress: playtimeProgressSchema.nullable(),
  points: z.array(chartPointSchema),
});

export const gameFriendsComparisonResponseSchema = z.object({
  appId: z.number(),
  friends: z.array(gameFriendComparisonSchema),
  friendsOnPlatform: z.number(),
  friendsWithData: z.number(),
  steamRefreshPending: z.number().optional(),
});

export const feedResponseSchema = z.object({
  games: z.array(libraryGameSchema),
  lastSyncAt: z.string().nullable(),
  generatedAt: z.string(),
  totalRecent: z.number(),
});

export type ChartPoint = z.infer<typeof chartPointSchema>;
export type GameHistory = z.infer<typeof gameHistorySchema>;
export type LibraryGame = z.infer<typeof libraryGameSchema>;
export type LibraryResponse = z.infer<typeof libraryResponseSchema>;
export type SyncResponse = z.infer<typeof syncResponseSchema>;
export type ScanUsage = z.infer<typeof scanUsageSchema>;
export type SingleGameSyncResponse = z.infer<typeof singleGameSyncResponseSchema>;
export type StatsResponse = z.infer<typeof statsResponseSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type Friend = z.infer<typeof friendSchema>;
export type FriendsResponse = z.infer<typeof friendsResponseSchema>;
export type GameFriendComparison = z.infer<typeof gameFriendComparisonSchema>;
export type GameFriendsComparisonResponse = z.infer<typeof gameFriendsComparisonResponseSchema>;
export type PlaytimeProgress = z.infer<typeof playtimeProgressSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
