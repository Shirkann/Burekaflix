// Render login page
export const loginGet = (req, res) => {
  res.render("auth/login", { error: null });
};

// Handle login POST
export const loginPost = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render("auth/login", { error: "יש למלא את כל השדות" });
  }
  const user = await User.findOne({ email });
  if (!user || !(await user.verifyPassword(password))) {
    return res.render("auth/login", { error: "אימייל או סיסמה שגויים" });
  }
  req.session.user = { id: user._id, email: user.email, isAdmin: user.isAdmin };
  res.redirect("/profiles");
};

// Render register page
export const registerGet = (req, res) => {
  res.render("auth/register", { error: null });
};

// Logout
export const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
};
export const registerPost = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  console.log("REGISTER BODY:", req.body); // לבדיקה – תראה בטרמינל

  if (!email || !password || !confirmPassword) {
    return res.render("auth/register", { error: "יש למלא את כל השדות" });
  }

  if (password !== confirmPassword) {
    return res.render("auth/register", { error: "הסיסמאות אינן תואמות" });
  }

  if (await User.findOne({ email })) {
    return res.render("auth/register", { error: "משתמש כבר קיים" });
  }

  const u = new User({ email });
  await u.setPassword(password);
  u.profiles.push({ name: "אני" });
  await u.save();

  req.session.user = { id: u._id, email: u.email, isAdmin: u.isAdmin };
  res.redirect("/profiles");
};
