export const auth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect("/login");
};

export const profile = (req, res, next) => {
  if (req.session && req.session.profile) {
    return next();
  }
  return res.redirect("/profiles");
};
