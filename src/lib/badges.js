// Badges: en samlarbar bild per kocknivå ("gubbe" som blir finare ju högre nivå),
// plus milstolpe-badges för antal lagade rätter (första rätten, 10 rätter, osv).
import { LEVELS, levelInfo } from "./xp.js";

// Ringfärg (eller gradient) per "rank" - grå -> brons -> silver -> guld -> diamant.
const TIER_STYLE = [
  { bg: "#D8D8DC", ring: "#B8B8BE" },
  { bg: "#D8D8DC", ring: "#B8B8BE" },
  { bg: "#D3A06C", ring: "#B87A3D" },
  { bg: "#D3A06C", ring: "#B87A3D" },
  { bg: "#C3CAD3", ring: "#9FA9B6" },
  { bg: "#C3CAD3", ring: "#9FA9B6" },
  { bg: "#FFCB4D", ring: "#E8A600" },
  { bg: "#FFCB4D", ring: "#E8A600" },
  { bg: "linear-gradient(135deg,#C9A6FF,#8E7CC3)", ring: "#7C5FC7" },
  { bg: "linear-gradient(135deg,#FFD6E8,#C9A6FF)", ring: "#B36FD6" },
];

const LEVEL_EMOJI = ["🧽", "🔪", "🥄", "🍳", "🔥", "🥘", "👨‍🍳", "🎩", "⭐", "👑"];

export const LEVEL_BADGES = LEVELS.map((level, i) => ({
  id: `level-${i}`,
  kind: "level",
  title: level.title,
  desc: level.desc,
  emoji: LEVEL_EMOJI[i],
  style: TIER_STYLE[i],
}));

export const MILESTONES = [
  { id: "m1", count: 1, title: "Första rätten", emoji: "🍽️", desc: "Lagade sin första rätt från Köket.", style: TIER_STYLE[0] },
  { id: "m10", count: 10, title: "10 rätter", emoji: "🍲", desc: "Lagade 10 rätter från Köket.", style: TIER_STYLE[2] },
  { id: "m25", count: 25, title: "25 rätter", emoji: "🥘", desc: "Lagade 25 rätter från Köket.", style: TIER_STYLE[4] },
  { id: "m50", count: 50, title: "50 rätter", emoji: "🍱", desc: "Lagade 50 rätter från Köket.", style: TIER_STYLE[6] },
  { id: "m100", count: 100, title: "100 rätter", emoji: "🏆", desc: "Lagade 100 rätter från Köket.", style: TIER_STYLE[8] },
  { id: "m250", count: 250, title: "250 rätter", emoji: "🌟", desc: "Lagade 250 rätter från Köket.", style: TIER_STYLE[9] },
];

// Alla badges för en användare: vilken nivå (och alla nivåer man passerat) man nått,
// samt vilka rätt-milstolpar man klarat.
export function allBadgesFor(xp, dishCount) {
  const level = levelInfo(xp);
  return {
    levels: LEVEL_BADGES.map((b, i) => ({ ...b, earned: i < level.level })),
    milestones: MILESTONES.map((m) => ({ ...m, earned: dishCount >= m.count })),
  };
}

// Den senaste/finaste badgen att visa i profilen - alltid nuvarande kocknivå,
// eftersom den redan representerar allt man samlat på sig hittills.
export function latestBadge(xp) {
  const level = levelInfo(xp);
  return LEVEL_BADGES[level.level - 1];
}
