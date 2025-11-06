import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import dotenv from "dotenv";
import morgan from "morgan";
import methodOverride from "method-override";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const MONGO_URI =
  process.env.MONGO_URI || "mongodb+srv://admin_burekaflix:<db_password>@burekaflix.c97tbrj.mongodb.net/?appName=BurekaFlix";

await mongoose.connect(MONGO_URI);

// Views removed: serving static HTML from public/

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// serve repository root logo file (user added `logo.png` at project root)
app.get('/logo.png', (req, res) => res.sendFile(path.join(__dirname, 'logo.png')));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentProfile = req.session.profile || null;
  next();
});

import auth from "./src/routes/auth.js";
import profiles from "./src/routes/profiles.js";
import catalog from "./src/routes/catalog.js";
import content from "./src/routes/content.js";
import admin from "./src/routes/admin.js";
import api from "./src/routes/api.js";

app.use("/", auth);
app.use("/profiles", profiles);
app.use("/catalog", catalog);
app.use("/content", content);
app.use("/admin", admin);
app.use("/api", api);

app.get("/", (req, res) =>
  !req.session.user ? res.redirect("/login") : res.redirect("/catalog")
);

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'errors', '404.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).sendFile(path.join(__dirname, 'public', 'errors', '500.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("BurekaFlix ▶ http://localhost:" + PORT));
