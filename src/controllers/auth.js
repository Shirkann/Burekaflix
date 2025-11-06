// Render login page
import path from "path";
import User from "../models/User.js";

export const loginGet = (req, res) => {
  // serve static login page
  return res.sendFile(path.join(process.cwd(), "public", "login.html"));
};

// Handle login POST
export const loginPost = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.redirect('/login?error=' + encodeURIComponent('יש למלא את כל השדות'));
  }
  const user = await User.findOne({ email });
  if (!user || !(await user.verifyPassword(password))) {
    return res.redirect('/login?error=' + encodeURIComponent('אימייל או סיסמה שגויים'));
  }
  req.session.user = { id: user._id, email: user.email, isAdmin: user.isAdmin };
  res.redirect('/profiles');
};

// Render register page
export const registerGet = (req, res) => {
  return res.sendFile(path.join(process.cwd(), "public", "register.html"));
};

// Logout
export const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
export const registerPost = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  console.log("REGISTER BODY:", req.body); // לבדיקה – תראה בטרמינל

  if (!email || !password || !confirmPassword) {
    return res.redirect('/register?error=' + encodeURIComponent('יש למלא את כל השדות'));
  }

  if (password !== confirmPassword) {
    return res.redirect('/register?error=' + encodeURIComponent('הסיסמאות אינן תואמות'));
  }

  if (await User.findOne({ email })) {
    return res.redirect('/register?error=' + encodeURIComponent('משתמש כבר קיים'));
  }

  const u = new User({ email });
  await u.setPassword(password);
  u.profiles.push({ name: "אני" });
  await u.save();

  req.session.user = { id: u._id, email: u.email, isAdmin: u.isAdmin };
  res.redirect("/profiles");
};
