import mongoose from "mongoose";
const ContentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    type: { type: String, enum: ["movie", "series"], required: true },
    year: Number,
    stagemanager: String,
    players: [String],
    genres: [String],
    summary: String,
    posterUrl: String,
    videoUrl: String,
    episodes: [String],
    popularity: { type: Number, default: 0 },
    imdb_rating: Number,
    wikipedia: String,
    likedByUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default mongoose.model("Content", ContentSchema);
