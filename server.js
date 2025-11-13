import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import dotenv from "dotenv";
import morgan from "morgan";
import methodOverride from "method-override";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

import auth from "./src/routes/auth.js";
import profiles from "./src/routes/profiles.js";
import catalog from "./src/routes/catalog.js";
import content from "./src/routes/content.js";
import admin from "./src/routes/admin.js";
import api from "./src/routes/api.js";
import stats from "./src/routes/stats.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const PORT = process.env.PORT;

dotenv.config();

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected."))
  .catch((error) => {
    console.error("Mongo connection failed:", error);
  });

app.set("views", path.join(__dirname, "src", "views"));
app.set("view engine", "ejs");
app.locals.basedir = app.get("views");

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
  }),
);
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/logo.png", (req, res) =>
  res.sendFile(path.join(__dirname, "logo.png")),
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentProfile = req.session.profile || null;
  next();
});

app.use("/", auth);
app.use("/profiles", profiles);
app.use("/catalog", catalog);
app.use("/content", content);
app.use("/admin", admin);
app.use("/api", api);
app.use("/stats", stats);

app.get("/", (req, res) =>
  !req.session.user ? res.redirect("/login") : res.redirect("/catalog"),
);

app.get("/test-mongo", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).send("MongoDB connection is working correctly.");
  } catch (error) {
    console.error("MongoDB connection test failed:", error);
    res
      .status(500)
      .send("MongoDB connection test failed. Check server logs for details.");
  }
});

app.use((req, res) => res.status(404).render("errors/404"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("errors/500");
});

app.listen(PORT, () => console.log("BurekaFlix ▶ http://localhost:" + PORT));
