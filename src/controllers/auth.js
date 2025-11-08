import User from "../models/User.js";

const redirectWithError = (res, path, message) =>
  res.redirect(`${path}?error=${encodeURIComponent(message)}`);

export const loginGet = (req, res) => {
  return res.render("auth/login", { error: req.query.error || null });
};

export const loginPost = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return redirectWithError(res, "/login", "יש למלא את כל השדות");
  }
  const user = await User.findOne({ username });
  if (!user || !(await user.verifyPassword(password))) {
    return redirectWithError(res, "/login", "שם משתמש או סיסמה שגויים");
  }
  req.session.user = { id: user._id, username: user.username, isAdmin: user.isAdmin };
  res.redirect('/profiles');
};

export const registerGet = (req, res) => {
  return res.render("auth/register", { error: req.query.error || null });
};

export const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
export const registerPost = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return redirectWithError(res, "/register", "יש למלא את כל השדות");
  }

  if (password !== confirmPassword) {
    return redirectWithError(res, "/register", "הסיסמאות אינן תואמות");
  }

  if (await User.findOne({ username })) {
    return redirectWithError(res, "/register", "משתמש כבר קיים");
  }

  const u = new User({ username });
  await u.setPassword(password);
  u.profiles.push({ name: "אני" });
  await u.save();

  req.session.user = { id: u._id, username: u.username, isAdmin: u.isAdmin };
  res.redirect("/profiles");
};
