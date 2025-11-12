import User from "../models/User.js";
import { getSimpleRecommendationsForProfile } from "../services/recommendations.js";

const rawGenreBatchLimit = Number(process.env.GENRE_PAGE_BATCH_LIMIT);
let GENRE_PAGE_BATCH_LIMIT = 30;
if (Number.isFinite(rawGenreBatchLimit) && rawGenreBatchLimit > 0) {
  GENRE_PAGE_BATCH_LIMIT = Math.floor(rawGenreBatchLimit);
}

async function loadInitialRecommendations(req) {
  try {
    if (!req.session?.user?.id || !req.session?.profile) {
      return [];
    }
    const user = await User.findById(req.session.user.id).lean();
    if (!user) return [];
    const profile =
      user.profiles?.find?.((p) => String(p._id) === req.session.profile) ||
      null;
    if (!profile) return [];
    return await getSimpleRecommendationsForProfile(profile);
  } catch (err) {
    console.error("Failed to load initial recommendations", err);
    return [];
  }
}

export const home = async (req, res) => {
  const recommendations = await loadInitialRecommendations(req);
  return res.render("catalogBrowse", {
    pageTitle: "Catalog - BurekaFlix",
    initialGenre: req.query.genre || "",
    recommendations,
  });
};

export const byGenre = async (req, res) => {
  const recommendations = await loadInitialRecommendations(req);
  return res.render("catalogBrowse", {
    pageTitle: `ז׳אנר: ${req.params.genre}`,
    initialGenre: req.params.genre,
    recommendations,
  });
};

export const genrePage = async (_req, res) => {
  return res.render("genreBrowser", {
    pageTitle: "עמוד הז׳אנרים - BurekaFlix",
    batchLimit: GENRE_PAGE_BATCH_LIMIT,
  });
};
