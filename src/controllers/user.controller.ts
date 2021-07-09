import { Request, Response } from 'express'
import { sign, verify } from 'jsonwebtoken'
import { get, omit } from 'lodash'
import fetch from "node-fetch";
import { google } from "googleapis";
import { ENDPOINT } from '..'
import User from '../models/user.model'
import sendMail from '../utils/sendMail'

const { OAuth2 } = google.auth;
const { FACEBOOK_SECRET, GOOGLE_SECRET, NODE_ENV, CLIENT_URL, ACTIVATION_TOKEN_SECRET, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, MAILING_SERVICE_CLIENT_ID } = process.env

const clientUrl = NODE_ENV === 'development' ? "localhost:3000" : CLIENT_URL

const client = new OAuth2(MAILING_SERVICE_CLIENT_ID as string)

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = get(req, "body")

    const user = await User.findOne({ email }).lean()
    if (user) return res.status(400).json({ message: 'This email already exists.' })

    const activation_token = createActivationToken({ name, email, password })

    const url = `${clientUrl}/user/activation/${activation_token}`

    sendMail(email, url, "Xác minh")

    return res.status(200).json({ message: 'Register success! Please activate your email to start' })
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
export const activateEmail = async (req: Request, res: Response) => {
  try {
    const { activation_token } = get(req, "body")

    const { name, email, password }: any = verify(activation_token, ACTIVATION_TOKEN_SECRET as string)


    const isExist = await User.findOne({ email }).lean()
    if (isExist) return res.status(400).json({ message: "This email already exists." });

    const newUser = new User({ name, email, password })

    await newUser.save()
    return res.status(200).json({ message: "Account has been activated." });
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = get(req, "body")
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "This email does not exist." });

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(400).json({ message: "Password is incorrect." });

    const refresh_token = createRefreshToken({ id: user._id, role: user.role });
    setRefreshToken(res, refresh_token)
    return res.status(200).json({ message: "Login successfully." });
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
export const getAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshtoken } = get(req, "cookies")

    if (!refreshtoken) return res.status(400).json({ message: "Haven't token.Please login now!" });

    const user: any = verify(refreshtoken, REFRESH_TOKEN_SECRET as string);
    const access_token = createAccessToken({ id: user.id, role: user.role });

    return res.status(200).json({ access_token: access_token });
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = get(req, "body")
    const user = await User.findOne({ email }).lean()
    if (!user) return res.status(404).json({ message: "This email does not exist." });
    const access_token = createAccessToken({ id: user._id, role: user.role });
    const url = `${clientUrl}/user/reset/${access_token}`;
    sendMail(email, url, "Reset your password");
    return res.status(200).json({ message: "Check your email to reset your password." });
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password } = get(req, "body")
    const { id } = get(req, "user")
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ message: "This user does not exist." });
    user.password = password;
    await user.save()
    return res.status(200).json({ message: "Password successfully changed!" });
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const { id } = get(req, "user")
    const user = await User.findById(id).select("-password").lean();
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("refreshtoken", { path: `${ENDPOINT}/user/refresh_token` });
    return res.status(200).json({ message: "Logged out!" });
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { tokenId } = get(req, "body")
    const verify: any = await client.verifyIdToken({ idToken: tokenId, audience: MAILING_SERVICE_CLIENT_ID as string });
    const { email_verified, email, name, picture } = verify.payload;
    if (!email_verified) return res.status(400).json({ message: "Email verification failed." });
    const password = email + GOOGLE_SECRET;
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: "Password is incorrect." });
      user.name = name;
      user.avatar = picture;
      await user.save();
      const refresh_token = createRefreshToken({ id: user._id, role: user.role });
      setRefreshToken(res, refresh_token)
      return res.status(200).json({ message: "Login success!" });
    } else {
      const newUser = new User({ name, email, password, avatar: picture, social: "google" });
      await newUser.save();
      const refresh_token = createRefreshToken({ id: newUser._id, role: newUser.role });
      setRefreshToken(res, refresh_token)
      return res.status(200).json({ message: "Login success!" });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
export const facebookLogin = async (req: Request, res: Response) => {
  try {
    const { accessToken, userID } = get(req, "body")
    const URL = `https://graph.facebook.com/v2.9/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`;
    const data: any = await fetch(URL)
      .then((res: any) => res.json())
    const { email, name, picture } = data;
    const password = email + FACEBOOK_SECRET;
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: "Password is incorrect." });
      user.name = name;
      user.avatar = picture.data.url;
      await user.save();
      const refresh_token = createRefreshToken({ id: user._id, role: user.role });
      setRefreshToken(res, refresh_token)
      return res.status(200).json({ message: "Login success!" });
    } else {
      const newUser = new User({ name, email, password, avatar: picture.data.url, social: "facebook" });
      await newUser.save();
      const refresh_token = createRefreshToken({ id: newUser._id, role: newUser.role });
      setRefreshToken(res, refresh_token)
      return res.status(200).json({ message: "Login success!" });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message })
  }
}
const setRefreshToken = (res: Response, refresh_token: string) => {
  res.cookie("refreshtoken", refresh_token, {
    httpOnly: true,
    path: `${ENDPOINT}/users/token`,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
const createActivationToken = (payload: any) => sign(payload, ACTIVATION_TOKEN_SECRET as string, { expiresIn: "5m" });
const createAccessToken = (payload: any) => sign(payload, ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
const createRefreshToken = (payload: any) => sign(payload, REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" });