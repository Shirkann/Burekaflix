import { Router } from "express";
import { auth, profile } from "./guards.js";
import { home, byGenre, genrePage } from "../controllers/catalog.js";
const r = Router();
r.use(auth);
r.get("/", profile, home);
r.get("/genres", profile, genrePage);
r.get("/genre/:genre", profile, byGenre);
export default r;
