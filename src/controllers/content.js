import Content from "../models/Content.js";
import User from "../models/User.js";

export const details = async (req, res) => {
  if (req.prefersJson) {
    const content = await Content.findById(req.params.id).lean();
    if (!content) return res.status(404).json({ error: "not found" });
    return res.json(content);
  }
  return res.render("content/show");
};
export const like = async (req, res) => {
  const u = await User.findById(req.session.user.id);
  const p = u.profiles.find((p) => String(p._id) === req.session.profile);
  const id = req.params.id;
  const i = p.liked.findIndex((x) => String(x) === id);
  let liked;
  if (i >= 0) {
    p.liked.splice(i, 1);
    liked = false;
  } else {
    p.liked.push(id);
    liked = true;
  }
  await u.save();
  res.json({ ok: true, liked });
};
