import { Router } from "express";
import { auth, profile } from "./guards.js";
import { details, like, unlike } from "../controllers/content.js";

const r = Router();
r.use(auth);

// עדכון הנתיב כך שיציג את התבנית ישירות
r.get("/:id", profile, (req, res) => {
  res.render("content/show");
});

// דף נגן
r.get("/:id/player", profile, (req, res) => {
  res.render("content/player");
});

// נתיב API לטעינת פרטי התוכן
r.get("/api/:id", profile, details);

r.post("/:id/like", profile, like);
r.post("/:id/unlike", profile, unlike);

export default r;
