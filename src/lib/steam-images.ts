import { getSteamIconUrl } from "@/services/steam.service";

/** URLs de carátula en orden de preferencia (Steam usa distintos CDNs/formatos). */
export function getSteamCoverUrlCandidates(
  appId: number,
  imgIconUrl?: string | null,
  imgLogoUrl?: string | null,
): string[] {
  const urls: string[] = [
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/capsule_616x353.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
    `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
    `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_616x353.jpg`,
    `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`,
    `https://cdn.steamstatic.com/steam/apps/${appId}/header.jpg`,
  ];

  const icon = getSteamIconUrl(appId, imgIconUrl);
  if (icon) urls.push(icon);

  const logo = getSteamIconUrl(appId, imgLogoUrl);
  if (logo && logo !== icon) urls.push(logo);

  return [...new Set(urls)];
}
