import Content from "../models/Content.js";
import User from "../models/User.js";

export const details = async (req, res) => {
  try {
    const contentId = req.params.id;

    // שליפת פרטי הסרט
    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    if (req.session.user && req.session.profile) {
      const user = await User.findById(req.session.user.id).populate("profiles.liked");
      const profile = user.profiles.find((p) => String(p._id) === req.session.profile);
      const foundItem = profile.liked.find((item) => item._id.toString() === contentId);
      content.likedByUser = !!foundItem;
    }
    
    res.render("content/show", { content });
  } catch (error) {
    console.error("Error loading content details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const like = async (req, res) => 
  {
  const u = await User.findById(req.session.user.id);
  const p = u.profiles.find((p) => String(p._id) === req.session.profile);
  const id = req.params.id;
  const i = p.liked.findIndex((x) => String(x) === id);
  let liked;
  if (i >= 0) {
    p.liked.splice(i, 1);
    liked = false;
  } else {
    p.liked.push(id);
    liked = true;
  }
  await u.save();
  res.json({ ok: true, liked });
};

export const unlike = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const profile = user.profiles.find((p) => String(p._id) === req.session.profile);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const contentId = req.params.id;
    const index = profile.liked.findIndex((item) => String(item) === contentId);

    if (index === -1) {
      return res.status(400).json({ error: "Content not liked" });
    }

    // הסרת התוכן ממערך התכנים שאהבתי
    profile.liked.splice(index, 1);
    await user.save();

    res.json({ ok: true, liked: false });
  } catch (error) {
    console.error("Error in unlike:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
