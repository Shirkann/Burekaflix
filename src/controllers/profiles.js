import User from "../models/User.js";

const successRedirect = (req, res, message, data = {}) => {
  if (req.prefersJson) return res.json({ ok: true, message, ...data });
  const suffix = message ? `?message=${encodeURIComponent(message)}` : "";
  return res.redirect(`/profiles${suffix}`);
};

const errorRedirect = (req, res, message, status = 400) => {
  if (req.prefersJson) return res.status(status).json({ error: message });
  return res.redirect(`/profiles?error=${encodeURIComponent(message)}`);
};

export const index = (req, res) => {
  return res.render("profiles/index", {
    message: req.query.message || null,
    error: req.query.error || null,
  });
};

export const apiList = async (req, res) => {
  const u = await User.findById(req.session.user.id).lean();
  return res.json(u?.profiles || []);
};
export const create = async (req, res) => {
  const u = await User.findById(req.session.user.id);
  if (!u) return errorRedirect(req, res, "משתמש לא נמצא", 404);
  if (u.profiles.length >= 5) return errorRedirect(req, res, "לא ניתן ליצור יותר מ-5 פרופילים");
  const name = (req.body?.name || "").trim() || "פרופיל";
  u.profiles.push({ name });
  await u.save();
  const profileDoc = u.profiles[u.profiles.length - 1];
  const profile = typeof profileDoc.toObject === "function" ? profileDoc.toObject() : profileDoc;
  return successRedirect(req, res, `${profile.name} נוצר בהצלחה`, { profile });
};
export const select = (req, res) => {
  req.session.profile = req.params.pid;
  if (req.prefersJson) return res.json({ ok: true, redirect: "/catalog" });
  res.redirect("/catalog");
};
export const remove = async (req, res) => {
  const u = await User.findById(req.session.user.id);
  if (!u) return errorRedirect(req, res, "משתמש לא נמצא", 404);
  const before = u.profiles.length;
  u.profiles = u.profiles.filter((p) => String(p._id) !== req.params.pid);
  if (u.profiles.length === before) return errorRedirect(req, res, "פרופיל לא נמצא", 404);
  await u.save();
  if (req.session.profile === req.params.pid) req.session.profile = null;
  return successRedirect(req, res, "הפרופיל הוסר");
};
