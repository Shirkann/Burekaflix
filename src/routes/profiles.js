import { Router } from "express";
import { auth } from "./guards.js";
import {
  index,
  create,
  select,
  remove,
  apiList,
} from "../controllers/profiles.js";
const r = Router();
r.use(auth);
r.get("/", index);
r.get("/api", apiList);
r.post("/", create);
r.get("/select/:pid", select);
r.post("/delete/:pid", remove);
export default r;
