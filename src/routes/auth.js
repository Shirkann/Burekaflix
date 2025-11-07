import { Router } from "express";
import {
  loginGet,
  loginPost,
  registerGet,
  registerPost,
  logout,
} from "../controllers/auth.js";

const r = Router();

r.get("/login", loginGet);
r.get("/register", registerGet);

r.post("/login", loginPost);
r.post("/register", registerPost);
r.post("/logout", logout);

export default r;
