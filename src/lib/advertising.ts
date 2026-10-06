import { site } from '../data/site';
export function activeAdvertisement(location: string) {
  const campaign = site.adPlacements.find((p) => p.location === location);
  return site.advertisingEnabled &&
    campaign?.enabled &&
    campaign.sponsorLabel &&
    campaign.targetUrl &&
    /^https:\/\//.test(campaign.targetUrl)
    ? campaign
    : null;
}
