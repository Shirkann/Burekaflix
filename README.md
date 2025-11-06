# BurekaFlix – Full Stack (Node + Express + MongoDB)
פרויקט מלא בסגנון נטפליקס כחול-לבן לסרטי בורקס. כולל הגדרת ejs-mate (layout).

## הפעלה
```bash
npm install
cp .env.sample .env   # Windows: copy .env.sample .env
# עריכת .env אם צריך (MONGO_URI בלבד)
npm run seed
npm run dev           # http://localhost:3000
```

## טיפ
להפיכת משתמש ל-admin:
```js
// במונגו (mongosh):
use burekaflix
db.users.updateOne({ email: "you@example.com" }, { $set: { isAdmin: true } })
```
