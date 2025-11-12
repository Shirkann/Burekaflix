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
  res.render("profilesDashboard", viewData);
};

export const apiList = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "יש להתחבר מחדש" });
  }
  const user = await User.findById(req.session.user.id).lean();
  if (!user) {
    return res.status(404).json({ error: "משתמש לא נמצא" });
  }
  res.json(user.profiles || []);
};

export const create = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.redirect(
      "/profiles?error=" + encodeURIComponent("יש להתחבר מחדש"),
    );
  }
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
  user.profiles.push({
    name: profileName,
    playBtnDates: [],
    continueWatching: [],
    alreadyWatched: [],
  });
  await user.save();
  return res.redirect(
    "/profiles?message=" + encodeURIComponent(profileName + " נוצר בהצלחה"),
  );
};

export const select = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.redirect(
      "/profiles?error=" + encodeURIComponent("יש להתחבר מחדש"),
    );
  }
  const user = await User.findById(req.session.user.id).lean();
  if (!user) {
    return res.redirect(
      "/profiles?error=" + encodeURIComponent("משתמש לא נמצא"),
    );
  }

  const profileId = req.params.pid;
  const profileList = Array.isArray(user.profiles) ? user.profiles : [];
  const hasProfile = profileList.some(
    (profile) => String(profile._id) === profileId,
  );
  if (!hasProfile) {
    return res.redirect(
      "/profiles?error=" + encodeURIComponent("פרופיל לא נמצא"),
    );
  }

  req.session.profile = profileId;
  res.redirect("/catalog");
};

export const remove = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.redirect(
      "/profiles?error=" + encodeURIComponent("יש להתחבר מחדש"),
    );
  }
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
