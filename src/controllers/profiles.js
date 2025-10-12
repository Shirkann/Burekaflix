import User from "../models/User.js";
export const index = async (req, res) => {
  const u = await User.findById(req.session.user.id);
  res.render("profiles/index", { profiles: u.profiles });
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
