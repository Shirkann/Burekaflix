import mongoose from "mongoose";
import bcrypt from "bcrypt";
const PlayDateSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const ContinueWatchingSchema = new mongoose.Schema(
  {
    videoName: { type: String, required: true },
    seconds: { type: Number, default: 0, min: 0 },
    // optional total duration in seconds to compute percentage in UI
    duration: { type: Number, min: 0 },
  },
  { _id: false }
);

const Profile = new mongoose.Schema(
  {
    name: { type: String, required: true },
    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],
    playBtnDates: { type: [PlayDateSchema], default: [] },
    continueWatching: { type: [ContinueWatchingSchema], default: [] },
  },
  { _id: true }
);
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    profiles: { type: [Profile], default: [] },
  },
  { timestamps: true }
);
UserSchema.methods.setPassword = async function (pw) {
  this.passwordHash = await bcrypt.hash(pw, 10);
};
UserSchema.methods.validatePassword = function (pw) {
  return bcrypt.compare(pw, this.passwordHash);
};
UserSchema.methods.verifyPassword = UserSchema.methods.validatePassword;
export default mongoose.model("User", UserSchema);
