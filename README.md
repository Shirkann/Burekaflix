# 🎬 BurekaFlix — Full Stack (Node + Express + MongoDB)

פרויקט **בורקאפליקס** הוא מערכת צפייה וניהול תוכן בהשראת Netflix 🍿  
נבנה במסגרת קורס _פיתוח אפליקציות אינטרנטיות_, ומשלב **Node.js**, **Express**, **MongoDB** ו-**EJS** עם תבניות Layout של `ejs-mate`.  
המטרה: ליצור חוויה מלאה של אתר סטרימינג - עם ממשק משתמש כחול-לבן 🇮🇱, ניהול תוכן, משתמשים והרשאות.

🔗 **דמו חי:** https://shirkann.github.io/Burekaflix/

---

## ⚙️ Tech Stack

| Layer        | Technologies                           |
| :----------- | :------------------------------------- |
| 💻 Backend   | Node.js, Express.js                    |
| 🧠 Database  | MongoDB (Mongoose ODM)                 |
| 🎨 Frontend  | EJS + ejs-mate layouts                 |
| 🔒 Auth      | express-session, bcrypt                |
| 🧰 Utilities | dotenv, method-override, connect-mongo |

---

## 🚀 הוראות התקנה והרצה

1. התקינו את התלויות: `npm install`
2. העתיקו את קובץ ההגדרות: `cp .env.sample .env` (ב-Windows: `copy .env.sample .env`)
3. עדכנו בקובץ `.env` את `MONGO_URI` ו-`SESSION_SECRET` (ואת שאר המשתנים במידת הצורך)
4. (אופציונלי אך מומלץ) הריצו את היוצר לנתוני דמו: `npm run seed`
5. הפעילו את השרת בפיתוח: `npm run dev` ונפו לכתובת http://localhost:3000

---

## 🗂️ מבנה הפרויקט

```
Burekaflix/
├── server.js            # נקודת הכניסה של השרת
├── public/              # קבצי סטטיק: CSS/JS/תמונות
├── src/
│   ├── controllers/     # לוגיקה עסקית למסכים ו-API
│   ├── routes/          # Express routers למודולים (auth/admin/catalog)
│   ├── models/          # סכמות Mongoose עבור משתמשים ותוכן
│   ├── services/        # אינטגרציות (OMDb, המלצות)
│   ├── utils/           # עזרי שרת
│   └── views/           # תבניות EJS וניהול layout
├── .env.sample
├── package.json
└── README.md
```

---

## 🧭 פונקציונליות מרכזיות

- **אימות משתמשים וניהול פרופילים** — הרשמה, התחברות וניהול עד חמישה פרופילים למשתמש, כולל שמירת Continue Watching והיסטוריית צפייה לכל פרופיל (`src/controllers/auth.js`, `src/controllers/profiles.js`).
- **ספריית תוכן וקטלוג חכם** — עמודי קטגוריות עם טעינה אינסופית לפי `GENRE_PAGE_BATCH_LIMIT`, חיפוש ז׳אנרים, כרטיסיות תכנים והמלצות מותאמות אישית (`src/controllers/catalog.js`, `src/routes/api.js`).
- **נגן ותיעוד התקדמות** — נקודות עצירה, רשימת "המשך צפייה" ונתוני צפייה פר-וידאו דרך REST API ייעודי (`src/controllers/api.js`).
- **מנוע המלצות** — מודול המלצות פשוט שמנתח לייקים ותכנים שנצפו כדי להציע תכנים רלוונטיים לכל פרופיל (`src/services/recommendations.js`).
- **ניהול תכנים לאדמין** — טופס העלאת קבצי MP4, הוספת מטא-דאטה, משיכת נתונים מ-OMDb ועידכון פוסטרים ודירוגים אוטומטי (`src/controllers/admin.js`).
- **סטטיסטיקות ומדדי שימוש** — נתוני פופולריות לפי ז׳אנר ומעקב אחר לחיצות Play זמינים בלוח סטטיסטיקות ייעודי (`src/controllers/stats.js`, `src/routes/api.js`).

---

## 🌿 משתני סביבה רלוונטיים

- `GENRE_PAGE_BATCH_LIMIT` – גודל ה"חבילה" בכל טעינת אינסוף של רשימת התכנים בעמוד הז׳אנרים (ברירת מחדל: 30).
