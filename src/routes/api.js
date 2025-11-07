import { Router } from "express";
import { auth, profile } from "./guards.js";
import {
  catalogList,
  genreList,
  popular,
  newestByGenre,
  contentDetails,
  profilesHistory,
  profilesRecommendations,
} from "../controllers/api.js";

const r = Router();

r.get("/catalog", auth, catalogList);
r.get("/genre/:genre", auth, genreList);
r.get("/popular", auth, popular);
r.get("/newest-by-genre", auth, newestByGenre);
r.get("/content/:id", auth, contentDetails);

r.get("/profiles/history", auth, profile, profilesHistory);
r.get("/profiles/recommendations", auth, profile, profilesRecommendations);

// Movies API
r.get("/movies", auth, catalogList);

export default r;
