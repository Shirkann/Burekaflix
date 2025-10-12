import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import path from 'path';
import dotenv from 'dotenv';
import morgan from 'morgan';
import methodOverride from 'method-override';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import ejsMate from 'ejs-mate';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/burekaflix';

await mongoose.connect(MONGO_URI);

app.engine('ejs', ejsMate);
app.locals._layoutFile = 'layout';
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
  })
);
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentProfile = req.session.profile || null;
  next();
});

import auth from './src/routes/auth.js';
import profiles from './src/routes/profiles.js';
import catalog from './src/routes/catalog.js';
import content from './src/routes/content.js';
import admin from './src/routes/admin.js';

app.use('/', auth);
app.use('/profiles', profiles);
app.use('/catalog', catalog);
app.use('/content', content);
app.use('/admin', admin);

app.get('/', (req, res) =>
  !req.session.user ? res.redirect('/login') : res.redirect('/catalog')
);

app.use((req, res) => res.status(404).render('errors/404'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('errors/500', { error: err });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log('BurekaFlix ▶ http://localhost:' + PORT)
);
