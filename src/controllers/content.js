import Content from "../models/Content.js";
import User from "../models/User.js";
import { omdb } from "../services/ratings.js";
import path from "path";

export const details = async (req, res) => {
  // Serve a static content details page; client will fetch /api/content/:id
  return res.sendFile(path.join(process.cwd(), "public", "content.html"));
};
export const like = async (req, res) => {
  const u = await User.findById(req.session.user.id);
  const p = u.profiles.find((p) => String(p._id) === req.session.profile);
  const id = req.params.id;
  const i = p.liked.findIndex((x) => String(x) === id);
  if (i >= 0) p.liked.splice(i, 1);
  else p.liked.push(id);
  await u.save();
  res.json({ ok: true });
};
