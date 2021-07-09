import { compare, genSalt, hashSync } from "bcrypt";
import { HookNextFunction, Schema, Document, model } from "mongoose";



export interface UserDocument extends Document {
  email: string;
  name: string;
  socket?: string;
  avatar?: string;
  password: string;
  role?: number;
  social: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema({
  email: { type: String, required: [true, "Email is require"], unique: true },
  name: { type: String, require: [true, "Name is require"] },
  avatar: { type: String, default: "" },
  socket: { type: String, default: "" },
  social: { type: String, default: "default" },
  role: { type: Number, default: 0 },
  password: { type: String, required: [true, "Password is require"] }
}, { timestamps: true })

UserSchema.pre("save", async function (next: HookNextFunction) {
  let user = this as UserDocument;

  if (!user.isModified("password")) return next()

  const salt = await genSalt(10)

  const hash = await hashSync(user.password, salt)

  user.password = hash
  return next()
})

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  const user = this as UserDocument;
  return compare(candidatePassword, user.password).catch(e => false)
}

const User = model<UserDocument>("User", UserSchema)

export default User