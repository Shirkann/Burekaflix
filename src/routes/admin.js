import express from 'express';
import axios from 'axios';
import Content from '../models/Content.js';

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.session?.user?.username === 'admin') return next();
  return res.status(401).send('Unauthorized');
}

router.get('/add', requireAdmin, (req, res) => {
  // אם שמרת את ה-HTML כ-ejs אפשר: res.render('admin-add');
  // אם בקובץ סטטי: פשוט תגישו אותו כסטטי. כאן נחזיר OK כדי שיהיה minimal.
  res.send('Use your existing HTML form that posts to POST /admin/add');
});

router.post('/add', requireAdmin, async (req, res) => {
  try {
    let { title, type, year, genres, summary, posterUrl, videoUrl, wikipedia } = req.body;

    if (!title) return res.status(400).send('נדרש שם תוכן');
    if (type && !['movie', 'series'].includes(type)) type = 'movie';

    const genresList = (genres || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let rating = undefined;
    const apiKey = process.env.OMDB_API_KEY;
    if (apiKey) {
      try {
        const params = new URLSearchParams({
          t: title,
          ...(year ? { y: String(year) } : {}),
          apikey: apiKey
        }).toString();

        const { data } = await axios.get(`https://www.omdbapi.com/?${params}`);
        if (data && data.Response !== 'False') {
          if (data.imdbRating && data.imdbRating !== 'N/A') {
            rating = Number(data.imdbRating);
          }
          if ((!posterUrl || !posterUrl.trim()) && data.Poster && data.Poster !== 'N/A') {
            posterUrl = data.Poster;
          }
        }
      } catch (e) {
        console.warn('OMDb fetch failed:', e.message);
      }
    }

    const doc = await Content.create({
      title: title.trim(),
      type,
      year: year ? Number(year) : undefined,
      genres: genresList,
      summary: summary?.trim(),
      posterUrl: posterUrl?.trim(),
      videoUrl: videoUrl?.trim(),
      wikipedia: wikipedia?.trim(),
      rating,
      ratingSrc: rating ? 'OMDb' : undefined
    });

    res.status(201).send(`נוסף בהצלחה (${doc.title}) – id: ${doc._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('שגיאה בשמירת התוכן');
  }
});

export default router;
