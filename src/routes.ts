import express from 'express'
import { activateEmail, facebookLogin, forgotPassword, getAccessToken, getUserInfo, googleLogin, login, logout, registerUser, resetPassword } from './controllers/user.controller'
import { requireUser, validateRequest } from './middleware'
import { createUserSchema, loginUserSchema } from './schemas/user.schema'

const router = express.Router()

// User router
router.route("/users").post(validateRequest(createUserSchema), registerUser).delete(logout)
router.route("/users/login").post(validateRequest(loginUserSchema), login)
router.route("/users/active").post(activateEmail)
router.route("/users/token").get(getAccessToken)
router.route("/users/forgot").post(forgotPassword)
router.route("/users/reset").post(requireUser, resetPassword)
router.route("/users/info").get(requireUser, getUserInfo)
router.route("/users/google").post(googleLogin)
router.route("/users/facebook").post(facebookLogin)


export default router