import { Router } from "express";
import { auth, profile } from "./guards.js";
import {
  details,
  like,
  unlike,
  recordPlayClick,
} from "../controllers/content.js";

const r = Router();
r.use(auth);

r.get("/:id", profile, (req, res) => {
  res.render("content/show");
});

r.get("/:id/player", profile, (req, res) => {
  res.render("content/player");
});

r.get("/api/:id", profile, details);

r.post("/:id/like", profile, like);
r.post("/:id/unlike", profile, unlike);
r.post("/:id/track-play", profile, recordPlayClick);

export default r;
