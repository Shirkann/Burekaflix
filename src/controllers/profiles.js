import User from "../models/User.js";
import path from "path";

export const index = async (req, res) => {
  // Serve the static profiles page; client JS will fetch profiles via /profiles/api
  return res.sendFile(path.join(process.cwd(), "public", "profiles.html"));
};

export const apiList = async (req, res) => {
  const u = await User.findById(req.session.user.id);
  return res.json(u.profiles || []);
};
export const create = async (req, res) => {
  const u = await User.findById(req.session.user.id);
  u.profiles.push({ name: req.body.name || "פרופיל" });
  await u.save();
  res.redirect("/profiles");
};
export const select = (req, res) => {
  req.session.profile = req.params.pid;
  res.redirect("/catalog");
};
export const remove = async (req, res) => {
  const u = await User.findById(req.session.user.id);
  u.profiles = u.profiles.filter((p) => String(p._id) !== req.params.pid);
  await u.save();
  if (req.session.profile === req.params.pid) req.session.profile = null;
  res.redirect("/profiles");
};
