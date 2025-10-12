import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Content from '../src/models/Content.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/burekaflix';

await mongoose.connect(MONGO_URI);

const data = [
  {
    title: 'הסנדוויץ׳ של אילנה',
    type: 'movie',
    year: 1975,
    genres: ['קלאסיקה', 'קומדיה'],
    summary: 'מסעדה שכונתית, בורקס חם, ותור שלא נגמר.',
    posterUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  {
    title: 'צ׳יפס בצד',
    type: 'movie',
    year: 1978,
    genres: ['קומדיה', 'קאלט'],
    summary: 'שומר חניה וחלומות על במה.',
    posterUrl: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4'
  },
  {
    title: 'הכלה והבורקס',
    type: 'movie',
    year: 1982,
    genres: ['רומנטיקה', 'קלאסיקה'],
    summary: 'אהבה בלתי אפשרית עם טעם של פעם.',
    posterUrl: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
  }
];

await Content.deleteMany({});
await Content.insertMany(data);

console.log('Seeded:', data.length);

await mongoose.disconnect();
