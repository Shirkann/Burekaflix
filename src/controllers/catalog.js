import Content from "../models/Content.js";
import User from "../models/User.js";
export const home = async (req, res) => {
  const q = req.query.q || "";
  const filter = q ? { title: new RegExp(q, "i") } : {};
  const popular = await Content.find(filter).sort({ popularity: -1 }).limit(12);
  const genres = await Content.distinct("genres");
  const newestByGenre = {};
  for (const g of genres) {
    newestByGenre[g] = await Content.find({ genres: g })
      .sort({ createdAt: -1 })
      .limit(10);
  }
  let cw = [];
  if (req.session.profile) {
    const u = await User.findById(req.session.user.id).populate(
      "profiles.liked"
    );
    const p = u.profiles.find((p) => String(p._id) === req.session.profile);
    cw = p?.liked || [];
  }
  res.render("catalog/home", {
    popular,
    newestByGenre,
    q,
    genres,
    continueWatching: cw,
  });
};
export const byGenre = async (req, res) => {
  const items = await Content.find({ genres: req.params.genre })
    .sort({ popularity: -1 })
    .limit(60);
  res.render("catalog/genre", { genre: req.params.genre, items });
};
