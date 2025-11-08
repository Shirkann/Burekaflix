export const auth = (req, res, next) => {
  if (req.session.user) return next();
  if (req.prefersJson) return res.status(401).json({ error: "נדרשת התחברות" });
  return res.redirect('/login');
};
export const profile = (req, res, next) => {
  if (req.session.profile) return next();
  if (req.prefersJson) return res.status(401).json({ error: "בחרו פרופיל לצפייה" });
  return res.redirect('/profiles');
};
