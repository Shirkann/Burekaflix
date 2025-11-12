import Content from "../models/Content.js";
import User from "../models/User.js";

export const details = async (req, res) => {
  try {
    const contentId = req.params.id;

    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    if (req.session.user && req.session.profile) {
      const user = await User.findById(req.session.user.id).lean();
      if (user && Array.isArray(user.profiles)) {
        const profile = user.profiles.find(
          (p) => String(p._id) === req.session.profile,
        );
        if (profile && Array.isArray(profile.liked)) {
          const likedIds = profile.liked.map((item) => String(item));
          content.likedByUser = likedIds.includes(String(contentId));
        }
      }
    }

    res.render("contentDetails", { content });
  } catch (error) {
    console.error("Error loading content details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const like = async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.profile) {
      return res.status(401).json({ error: "Missing active profile" });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const profile = user.profiles.id(req.session.profile);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (!Array.isArray(profile.liked)) {
      profile.liked = [];
    }

    const contentId = String(req.params.id || "");
    const existingIndex = profile.liked.findIndex(
      (item) => String(item) === contentId,
    );
    let liked;
    if (existingIndex >= 0) {
      profile.liked.splice(existingIndex, 1);
      liked = false;
    } else {
      profile.liked.push(contentId);
      liked = true;
    }

    await user.save();
    res.json({ ok: true, liked });
  } catch (error) {
    console.error("like failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unlike = async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.profile) {
      return res.status(401).json({ error: "Missing active profile" });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const profile = user.profiles.id(req.session.profile);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const contentId = String(req.params.id || "");
    const index = profile.liked.findIndex((item) => String(item) === contentId);

    if (index === -1) {
      return res.status(400).json({ error: "Content not liked" });
    }

    profile.liked.splice(index, 1);
    await user.save();

    res.json({ ok: true, liked: false });
  } catch (error) {
    console.error("unlike failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const recordPlayClick = async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.profile) {
      return res.status(401).json({ error: "Missing active profile" });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const profile = user.profiles.id(req.session.profile);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (!Array.isArray(profile.playBtnDates)) {
      profile.playBtnDates = [];
    }

    const today = new Date().toISOString().split("T")[0];
    const entry = profile.playBtnDates.find((d) => d.date === today);
    if (entry) {
      entry.count += 1;
    } else {
      profile.playBtnDates.push({ date: today, count: 1 });
    }

    await user.save();
    res.json({ ok: true, date: today });
  } catch (error) {
    console.error("recordPlayClick failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
