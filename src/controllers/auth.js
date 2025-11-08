import User from "../models/User.js";

export const loginGet = (req, res) => {
  const error = req.query.error ? req.query.error : null;
  res.render("auth/login", { error });
};

export const loginPost = async (req, res) => {
  const username = req.body.username || "";
  const password = req.body.password || "";

  if (!username || !password) {
    return res.redirect("/login?error=" + encodeURIComponent("יש למלא את כל השדות"));
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.redirect("/login?error=" + encodeURIComponent("שם משתמש או סיסמה שגויים"));
  }

  const isValid = await user.verifyPassword(password);
  if (!isValid) {
    return res.redirect("/login?error=" + encodeURIComponent("שם משתמש או סיסמה שגויים"));
  }

  req.session.user = {
    id: user._id,
    username: user.username,
    isAdmin: user.isAdmin,
  };
  res.redirect("/profiles");
};

export const registerGet = (req, res) => {
  const error = req.query.error ? req.query.error : null;
  res.render("auth/register", { error });
};

export const registerPost = async (req, res) => {
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";
  const confirmPassword = req.body.confirmPassword || "";

  if (!username || !password || !confirmPassword) {
    return res.redirect("/register?error=" + encodeURIComponent("יש למלא את כל השדות"));
  }

  if (password !== confirmPassword) {
    return res.redirect("/register?error=" + encodeURIComponent("הסיסמאות אינן תואמות"));
  }

  const existing = await User.findOne({ username });
  if (existing) {
    return res.redirect("/register?error=" + encodeURIComponent("משתמש כבר קיים"));
  }

  const user = new User({ username });
  await user.setPassword(password);
  user.profiles.push({ name: "אני" });
  await user.save();

  req.session.user = {
    id: user._id,
    username: user.username,
    isAdmin: user.isAdmin,
  };
  res.redirect("/profiles");
};

export const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
