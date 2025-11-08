import mongoose from "mongoose";
const ContentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    type: { type: String, enum: ["movie", "series"], required: true },
    year: Number,
    genres: [String],
    summary: String,
    posterUrl: String,
    videoUrl: String,
    popularity: { type: Number, default: 0 },
    rating: Number,
    wikipedia: String,
  },
  { timestamps: true },
);
export default mongoose.model("Content", ContentSchema);
