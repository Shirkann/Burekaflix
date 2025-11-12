import Content from "../models/Content.js";
import User from "../models/User.js";
import { getSimpleRecommendationsForProfile } from "../services/recommendations.js";

const PARTIAL_COMPLETION_THRESHOLD = 2; // seconds from end to consider as completed

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

export const catalogList = async (req, res) => {
  try {
    const items = await Content.find({}).limit(100).lean();
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

export const profilesHistory = async (req, res) => res.json([]);
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
