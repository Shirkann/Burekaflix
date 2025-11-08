import User from "../models/User.js";

export const index = (req, res) => {
  const viewData = {};
  if (req.query.message) {
    viewData.message = req.query.message;
  } else {
    viewData.message = null;
  }
  if (req.query.error) {
    viewData.error = req.query.error;
  } else {
    viewData.error = null;
  }
  res.render("profiles/index", viewData);
};

export const apiList = async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();
  let profiles = [];
  if (user && user.profiles) {
    profiles = user.profiles;
  }
  res.json(profiles);
};

export const create = async (req, res) => {
  const user = await User.findById(req.session.user.id);
  if (!user) {
    return res.redirect(
      "/profiles?error=" + encodeURIComponent("משתמש לא נמצא"),
    );
  }
  if (user.profiles.length >= 5) {
    return res.redirect(
      "/profiles?error=" +
        encodeURIComponent("לא ניתן ליצור יותר מ-5 פרופילים"),
    );
  }
  let profileName = "";
  if (req.body && req.body.name) {
    profileName = req.body.name;
  }
  profileName = profileName.trim();
  if (!profileName) {
    profileName = "פרופיל";
  }
  user.profiles.push({ name: profileName });
  await user.save();
  return res.redirect(
    "/profiles?message=" + encodeURIComponent(profileName + " נוצר בהצלחה"),
  );
};

export const select = (req, res) => {
  req.session.profile = req.params.pid;
  res.redirect("/catalog");
};

export const remove = async (req, res) => {
  const user = await User.findById(req.session.user.id);
  if (!user) {
    return res.redirect(
      "/profiles?error=" + encodeURIComponent("משתמש לא נמצא"),
    );
  }
  const before = user.profiles.length;
  user.profiles = user.profiles.filter(function (profile) {
    return String(profile._id) !== req.params.pid;
  });
  if (user.profiles.length === before) {
    return res.redirect(
      "/profiles?error=" + encodeURIComponent("פרופיל לא נמצא"),
    );
  }
  await user.save();
  if (req.session.profile === req.params.pid) {
    req.session.profile = null;
  }
  return res.redirect(
    "/profiles?message=" + encodeURIComponent("הפרופיל הוסר"),
  );
};
