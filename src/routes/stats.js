import { Router } from "express";
import { auth, profile } from "./guards.js";
import { overview } from "../controllers/stats.js";

const r = Router();
r.use(auth, profile);
r.get("/", overview);

export default r;
