# 🎬 BurekaFlix — Full Stack (Node + Express + MongoDB)

פרויקט **בורקאפליקס** הוא מערכת צפייה וניהול תוכן בהשראת Netflix 🍿  
נבנה במסגרת קורס _פיתוח אפליקציות אינטרנטיות_, ומשלב **Node.js**, **Express**, **MongoDB** ו-**EJS** עם תבניות Layout של `ejs-mate`.  
המטרה: ליצור חוויה מלאה של אתר סטרימינג - עם ממשק משתמש כחול-לבן 🇮🇱, ניהול תוכן, משתמשים והרשאות.

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

## 🚀 Installation & Setup

```bash
# התקנת תלויות
npm install
cp .env.sample .env   # Windows: copy .env.sample .env
# עריכת .env אם צריך (MONGO_URI/SESSION_SECRET)
npm run seed

# הפעלת השרת
npm run dev
# 🌍 http://localhost:3000


Burekaflix/
│
├── src/
│   ├── routes/        # ניהול ראוטים (user/admin)
│   ├── controllers/   # לוגיקה של האפליקציה
│   ├── models/        # סכמות Mongoose
│   ├── views/         # קבצי EJS
│   └── public/        # סטטיים: CSS, JS, תמונות
│
├── .env.sample
├── package.json
└── README.md
```
