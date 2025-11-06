const express = require('express');
const axios = require('axios');
const router = express.Router();
const Content = require('../models/Content');

// אימות אדמין בסיסי (דמו). מומלץ להחליף במנגנון התחברות אמיתי.
function requireAdmin(req, res, next) {
  if (req.session?.user?.username === 'admin') return next();
  return res.status(401).send('Unauthorized');
}

// הצגת הטופס (אם הוא קובץ סטטי ב-/public, אפשר להגיש אותו ישירות מהסטטיק)
router.get('/add', requireAdmin, (req, res) => {
  // אם שמרת את ה-HTML כ-ejs אפשר: res.render('admin-add');
  // אם בקובץ סטטי: פשוט תגישו אותו כסטטי. כאן נחזיר OK כדי שיהיה minimal.
  res.send('Use your existing HTML form that posts to POST /admin/add');
});

// קליטת הטופס מהדף שהצגת
router.post('/add', requireAdmin, async (req, res) => {
  try {
    let { title, type, year, genres, summary, posterUrl, videoUrl, wikipedia } = req.body;

    // ולידציה בסיסית
    if (!title) return res.status(400).send('נדרש שם תוכן');
    if (type && !['movie', 'series'].includes(type)) type = 'movie';

    // פיצול ז׳אנרים מפסיקים
    const genresList = (genres || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // שליפת דירוג + השלמת פוסטר (אם חסר) מ-OMDb
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
          // אם המשתמש לא הכניס posterUrl — נשתמש ב-Poster מה-API אם קיים
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

    // החזרה פשוטה: אפשר להפנות לרשימה / להחזיר JSON / להציג הודעת הצלחה
    // אם אתה רוצה חזרה לעמוד הטופס עם הודעה:
    res.status(201).send(`נוסף בהצלחה (${doc.title}) – id: ${doc._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('שגיאה בשמירת התוכן');
  }
});

module.exports = router;
