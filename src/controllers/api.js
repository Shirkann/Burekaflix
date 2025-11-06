import Content from "../models/Content.js";
import User from "../models/User.js";

export const catalogList = async (req, res) => {
  const q = req.query.q || "";
  const filter = q ? { title: new RegExp(q, "i") } : {};
  const items = await Content.find(filter).limit(200);
  res.json(items);
};

export const genreList = async (req, res) => {
  const items = await Content.find({ genres: req.params.genre }).limit(200);
  res.json(items);
};

export const popular = async (req, res) => {
  const movies = await Content.find({ type: "movie" }).sort({ popularity: -1 }).limit(12);
  const series = await Content.find({ type: "series" }).sort({ popularity: -1 }).limit(12);
  res.json({ movies, series });
};

export const newestByGenre = async (req, res) => {
  const genres = await Content.distinct("genres");
  const out = {};
  for (const g of genres) {
    out[g] = await Content.find({ genres: g }).sort({ createdAt: -1 }).limit(10);
  }
  res.json(out);
};

export const profilesHistory = async (req, res) => {
  if (!req.session.user || !req.session.profile) return res.status(200).json([]);
  const u = await User.findById(req.session.user.id).populate("profiles.liked");
  const p = u.profiles.find((p) => String(p._id) === req.session.profile);
  res.json(p?.liked || []);
};

export const profilesRecommendations = async (req, res) => {
  if (!req.session.user || !req.session.profile) return res.status(200).json([]);
  const u = await User.findById(req.session.user.id).populate("profiles.liked");
  const p = u.profiles.find((p) => String(p._id) === req.session.profile);
  const liked = p?.liked || [];
  // derive genres from liked
  const genres = new Set();
  for (const item of liked) {
    (item.genres || []).forEach((g) => genres.add(g));
  }
  if (!genres.size) return res.status(200).json([]);
  const query = { genres: { $in: Array.from(genres) } };
  const items = await Content.find(query).limit(20);
  // exclude liked
  const likedIds = new Set(liked.map((i) => String(i._id)));
  const recs = items.filter((it) => !likedIds.has(String(it._id))).slice(0, 12);
  res.json(recs);
};

export const contentDetails = async (req, res) => {
  const c = await Content.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'not found' });
  res.json(c);
};
