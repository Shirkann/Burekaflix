import mongoose from "mongoose";
import bcrypt from "bcrypt";
const Profile = new mongoose.Schema(
  {
    name: { type: String, required: true },
    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],
  },
  { _id: true },
);
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    profiles: { type: [Profile], default: [] },
  },
  { timestamps: true },
);
UserSchema.methods.setPassword = async function (pw) {
  this.passwordHash = await bcrypt.hash(pw, 10);
};
UserSchema.methods.validatePassword = function (pw) {
  return bcrypt.compare(pw, this.passwordHash);
};
UserSchema.methods.verifyPassword = UserSchema.methods.validatePassword;
export default mongoose.model("User", UserSchema);
