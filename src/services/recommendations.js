import Content from "../models/Content.js";

function normalizeId(id) {
  if (!id) return null;
  if (typeof id === "string") return id;
  if (typeof id.toString === "function") return id.toString();
  return null;
}

function buildLikedIds(list) {
  const result = new Set();
  if (!Array.isArray(list)) {
    return result;
  }
  for (const value of list) {
    const normalized = normalizeId(value);
    if (normalized) {
      result.add(normalized);
    }
  }
  return result;
}

function buildWatchedVideoNames(entries) {
  const result = new Set();
  if (!Array.isArray(entries)) {
    return result;
  }
  for (const entry of entries) {
    if (!entry || typeof entry.videoName !== "string") {
      continue;
    }
    const cleaned = entry.videoName.trim();
    if (cleaned) {
      result.add(cleaned);
    }
  }
  return result;
}

export async function getSimpleRecommendationsForProfile(profile, limit = 5) {
  if (!profile) return [];

  const likedIds = buildLikedIds(profile.liked);
  const watchedVideoNames = buildWatchedVideoNames(profile.continueWatching);

  const likedContentsPromise = likedIds.size
    ? Content.find({ _id: { $in: Array.from(likedIds) } }).lean()
    : [];

  const watchedContentsPromise = watchedVideoNames.size
    ? Content.find({
        $or: [
          { videoUrl: { $in: Array.from(watchedVideoNames) } },
          { episodes: { $in: Array.from(watchedVideoNames) } },
        ],
      }).lean()
    : [];

  const [likedContents, watchedContents] = await Promise.all([
    likedContentsPromise,
    watchedContentsPromise,
  ]);

  const scoredMap = new Map();

  function applyScore(list, amount) {
    for (const item of list || []) {
      if (!item) continue;
      const id = normalizeId(item._id);
      if (!id) continue;
      const entry = scoredMap.get(id) || { item, score: 0 };
      entry.score += amount;
      scoredMap.set(id, entry);
    }
  }

  applyScore(likedContents, 2);
  applyScore(watchedContents, 1);

  const ranked = Array.from(scoredMap.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.item.updatedAt || 0) - (a.item.updatedAt || 0);
    })
    .slice(0, Math.max(1, limit))
    .map(({ item }) => item);

  return ranked;
}
