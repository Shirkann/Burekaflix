import Content from "../models/Content.js";
import User from "../models/User.js";
import { getSimpleRecommendationsForProfile } from "../services/recommendations.js";

const PARTIAL_COMPLETION_THRESHOLD = 2;

const rawGenreBatchLimit = Number(process.env.GENRE_PAGE_BATCH_LIMIT);
let GENRE_PAGE_BATCH_LIMIT = 30;
if (Number.isFinite(rawGenreBatchLimit) && rawGenreBatchLimit > 0) {
  GENRE_PAGE_BATCH_LIMIT = Math.floor(rawGenreBatchLimit);
}

async function getProfileFromSession(req, { lean = false } = {}) {
  try {
    if (!req.session?.user?.id || !req.session?.profile) {
      return { error: { status: 401, message: "Missing active profile" } };
    }
    const query = lean
      ? User.findById(req.session.user.id).lean()
      : User.findById(req.session.user.id);
    const user = await query;
    if (!user) {
      return { error: { status: 404, message: "User not found" } };
    }
    const profile = lean
      ? user?.profiles?.find?.((p) => String(p._id) === req.session.profile)
      : user?.profiles?.id?.(req.session.profile);
    if (!profile) {
      return { error: { status: 404, message: "Profile not found" } };
    }
    return { user, profile };
  } catch (error) {
    return {
      error: {
        status: 500,
        message: "Failed to load user profile",
        detail: error,
      },
    };
  }
}

function trackVideoCompletion(profile, videoName) {
  if (!profile) {
    return;
  }
  if (!Array.isArray(profile.alreadyWatched)) {
    profile.alreadyWatched = [];
  }
  let cleanedVideoName = "";
  if (typeof videoName === "string") {
    cleanedVideoName = videoName.trim();
  }
  if (!cleanedVideoName) {
    return;
  }
  const existingIdx = profile.alreadyWatched.findIndex(
    (name) => name === cleanedVideoName
  );
  if (existingIdx >= 0) {
    profile.alreadyWatched.splice(existingIdx, 1);
  }
  profile.alreadyWatched.push(cleanedVideoName);
}

function normalizeGenreParam(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function buildWatchedNamesSet(entries) {
  const set = new Set();
  if (!Array.isArray(entries)) {
    return set;
  }
  for (const entry of entries) {
    if (typeof entry !== "string") continue;
    const cleaned = entry.trim();
    if (cleaned) {
      set.add(cleaned);
    }
  }
  return set;
}

function isContentMarkedWatched(content, watchedSet) {
  if (!content || !watchedSet?.size) return false;
  const names = [];
  if (typeof content.videoUrl === "string" && content.videoUrl.trim().length) {
    names.push(content.videoUrl.trim());
  }
  if (Array.isArray(content.episodes)) {
    for (const ep of content.episodes) {
      if (typeof ep === "string" && ep.trim().length) {
        names.push(ep.trim());
      }
    }
  }
  return names.some((name) => watchedSet.has(name));
}

export const catalogList = async (req, res) => {
  try {
    const { q = "", genre = "" } = req.query || {};
    const filters = {};

    if (typeof q === "string" && q.trim().length) {
      filters.title = { $regex: q.trim(), $options: "i" };
    }

    if (typeof genre === "string" && genre.trim().length) {
      filters.genres = genre.trim();
    }

    const items = await Content.find(filters).limit(100).lean();
    res.json(items);
  } catch (e) {
    console.error("catalogList failed", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const genreList = async (req, res) => {
  try {
    const genre = req.params.genre;
    const items = await Content.find({ genres: genre }).limit(100).lean();
    res.json(items);
  } catch (e) {
    console.error("genreList failed", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const genreOptions = async (req, res) => {
  try {
    const genres = await Content.distinct("genres");
    const cleaned = (genres || [])
      .filter((genre) => typeof genre === "string" && genre.trim().length)
      .map((genre) => genre.trim())
      .sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base", numeric: true })
      );
    res.json(cleaned);
  } catch (e) {
    console.error("genreOptions failed", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const popular = async (req, res) => {
  try {
    const items = await Content.find({})
      .sort({ popularity: -1 })
      .limit(50)
      .lean();
    res.json(items);
  } catch (e) {
    console.error("popular failed", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const newestByGenre = async (req, res) => {
  try {
    const items = await Content.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(items);
  } catch (e) {
    console.error("newestByGenre failed", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const genreNewest = async (req, res) => {
  try {
    const genre = normalizeGenreParam(req.params.genre);
    if (!genre) {
      return res.status(400).json({ error: "חסר שם ז׳אנר" });
    }
    const items = await Content.find({ genres: genre })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(items);
  } catch (e) {
    console.error("genreNewest failed", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const genreContents = async (req, res) => {
  try {
    const genre = normalizeGenreParam(req.params.genre);
    if (!genre) {
      return res.status(400).json({ error: "חסר שם ז׳אנר" });
    }

    const { error, profile } = await getProfileFromSession(req, { lean: true });
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const sortParam = String(req.query.sort || "popularity").toLowerCase();
    const watchedParam = String(req.query.watched || "all").toLowerCase();
    const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0);
    const limit = GENRE_PAGE_BATCH_LIMIT;

    const sortStage =
      sortParam === "rating"
        ? { imdb_rating: -1, rating: -1, popularity: -1, createdAt: -1 }
        : { popularity: -1, createdAt: -1 };

    const watchedSet = buildWatchedNamesSet(profile.alreadyWatched);
    const watchedArray = Array.from(watchedSet);
    const filters = { genres: genre };

    if (watchedParam === "watched") {
      if (!watchedArray.length) {
        return res.json({ items: [], hasMore: false, nextOffset: offset });
      }
      filters.$or = [
        { videoUrl: { $in: watchedArray } },
        { episodes: { $in: watchedArray } },
      ];
    } else if (watchedParam === "unwatched" && watchedArray.length) {
      filters.$nor = [
        { videoUrl: { $in: watchedArray } },
        { episodes: { $in: watchedArray } },
      ];
    }

    const docs = await Content.find(filters)
      .sort(sortStage)
      .skip(offset)
      .limit(limit + 1)
      .lean();

    const items = docs.slice(0, limit).map((doc) => ({
      ...doc,
      watched: isContentMarkedWatched(doc, watchedSet),
    }));

    const hasMore = docs.length > limit;
    const nextOffset = offset + items.length;

    res.json({ items, hasMore, nextOffset });
  } catch (e) {
    console.error("genreContents failed", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const profilesHistory = async (req, res) => res.json([]);

export const profileWatchedList = async (req, res) => {
  try {
    const { error, profile } = await getProfileFromSession(req, { lean: true });
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }
    const watched = Array.isArray(profile.alreadyWatched)
      ? profile.alreadyWatched
      : [];
    res.json(watched);
  } catch (err) {
    console.error("profileWatchedList failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const profilesRecommendations = async (req, res) => {
  try {
    const { error, profile } = await getProfileFromSession(req, { lean: true });
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const recommendations = await getSimpleRecommendationsForProfile(profile);
    res.json(recommendations);
  } catch (err) {
    console.error("profilesRecommendations failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const continueWatchingList = async (req, res) => {
  try {
    const { error, profile } = await getProfileFromSession(req, { lean: true });
    if (error) return res.status(error.status).json({ error: error.message });

    res.json(profile.continueWatching || []);
  } catch (err) {
    console.error("continueWatchingList failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const continueWatchingEntry = async (req, res) => {
  try {
    const { videoName } = req.params;
    if (!videoName) return res.status(400).json({ error: "Missing videoName" });

    const { error, profile } = await getProfileFromSession(req, { lean: true });
    if (error) return res.status(error.status).json({ error: error.message });

    const entry = (profile.continueWatching || []).find(
      (item) => item.videoName === videoName
    );
    if (!entry) return res.status(404).json({ error: "Entry not found" });

    return res.json(entry);
  } catch (err) {
    console.error("continueWatchingEntry failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const upsertContinueWatching = async (req, res) => {
  try {
    const { videoName, seconds, duration } = req.body ?? {};
    if (!videoName || typeof seconds !== "number") {
      return res
        .status(400)
        .json({ error: "videoName and seconds are required" });
    }

    const normalizedSeconds = Math.max(0, Math.floor(seconds));
    const durationNumber = Number(duration);
    const isDurationValid =
      Number.isFinite(durationNumber) && durationNumber > 0;
    const shouldRemove =
      isDurationValid &&
      normalizedSeconds >= durationNumber - PARTIAL_COMPLETION_THRESHOLD;

    const { error, user, profile } = await getProfileFromSession(req, {
      lean: false,
    });
    if (error) return res.status(error.status).json({ error: error.message });

    if (!Array.isArray(profile.continueWatching)) {
      profile.continueWatching = [];
    }

    const idx = profile.continueWatching.findIndex(
      (item) => item.videoName === videoName
    );

    if (shouldRemove) {
      const removed = idx >= 0;
      if (removed) {
        profile.continueWatching.splice(idx, 1);
      }
      trackVideoCompletion(profile, videoName);
      await user.save();
      return res.json({ ok: true, removed });
    }

    if (idx >= 0) {
      const [existing] = profile.continueWatching.splice(idx, 1);
      existing.seconds = normalizedSeconds;
      profile.continueWatching.push(existing);
    } else {
      profile.continueWatching.push({ videoName, seconds: normalizedSeconds });
    }

    if (profile.continueWatching.length > 20) {
      const excess = profile.continueWatching.length - 20;
      profile.continueWatching.splice(0, excess);
    }

    await user.save();
    res.json({ ok: true, seconds: normalizedSeconds });
  } catch (err) {
    console.error("upsertContinueWatching failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const contentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findByIdAndUpdate(
      id,
      { $inc: { popularity: 1 } },
      { new: true }
    ).lean();
    if (!content) return res.status(404).json({ error: "Content not found" });

    let likedByUser = false;
    if (req.session?.user && req.session?.profile) {
      const user = await User.findById(req.session.user.id).lean();
      const prof = user?.profiles?.find?.(
        (p) => String(p._id) === req.session.profile
      );
      const liked = prof?.liked?.map?.((x) => String(x)) || [];
      likedByUser = liked.includes(String(id));
    }

    res.json({ ...content, likedByUser });
  } catch (e) {
    console.error("contentDetails failed", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const profilePlayStats = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const profile = user?.profiles?.find?.(
      (p) => String(p._id) === req.session.profile
    );
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const data = (profile.playBtnDates || [])
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(data);
  } catch (error) {
    console.error("profilePlayStats failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const genrePopularityStats = async (req, res) => {
  try {
    const contents = await Content.find(
      { popularity: { $gt: 0 } },
      { genres: 1, popularity: 1 }
    ).lean();

    const totals = {};
    for (const item of contents) {
      const popValue = item.popularity || 0;
      if (!popValue || !Array.isArray(item.genres)) continue;

      for (const genre of item.genres) {
        if (!genre) continue;
        totals[genre] = (totals[genre] || 0) + popValue;
      }
    }

    const data = Object.entries(totals)
      .filter(([, total]) => total > 0)
      .map(([genre, total]) => ({ genre, total }))
      .sort((a, b) => b.total - a.total);

    res.json(data);
  } catch (error) {
    console.error("genrePopularityStats failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
