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
