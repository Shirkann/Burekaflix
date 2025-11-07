import path from "path";
import User from "../models/User.js";

export const loginGet = (req, res) => {
  return res.sendFile(path.join(process.cwd(), "public", "login.html"));
};

export const loginPost = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.redirect('/login?error=' + encodeURIComponent('יש למלא את כל השדות'));
  }
  const user = await User.findOne({ username });
  if (!user || !(await user.verifyPassword(password))) {
    return res.redirect('/login?error=' + encodeURIComponent('שם משתמש או סיסמה שגויים'));
  }
  req.session.user = { id: user._id, username: user.username, isAdmin: user.isAdmin };
  res.redirect('/profiles');
};

export const registerGet = (req, res) => {
  return res.sendFile(path.join(process.cwd(), "public", "register.html"));
};

export const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
export const registerPost = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  console.log("REGISTER BODY:", req.body); // לבדיקה – תראה בטרמינל

  if (!username || !password || !confirmPassword) {
    return res.redirect('/register?error=' + encodeURIComponent('יש למלא את כל השדות'));
  }

  if (password !== confirmPassword) {
    return res.redirect('/register?error=' + encodeURIComponent('הסיסמאות אינן תואמות'));
  }

  if (await User.findOne({ username })) {
    return res.redirect('/register?error=' + encodeURIComponent('משתמש כבר קיים'));
  }

  const u = new User({ username });
  await u.setPassword(password);
  u.profiles.push({ name: "אני" });
  await u.save();

  req.session.user = { id: u._id, username: u.username, isAdmin: u.isAdmin };
  res.redirect("/profiles");
};
