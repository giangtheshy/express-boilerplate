import dotenv from 'dotenv';
dotenv.config()
import cors from "cors"
import express, { Application, Request, Response } from "express"
import morgan from 'morgan';
import cookieParser from "cookie-parser";
import connection from "./database/connection";
import log from "./logs"
import router from './routes';
import { deserializeUser } from './middleware';

const PORT = process.env.PORT || 5000
export const ENDPOINT = "/api/v1"

const app: Application = express()
app.use(cors({
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  origin: process.env.NODE_ENV === "production" ? "https://khumuivietnam.com" : "http://localhost:3000",
}))
app.use(morgan("tiny"))
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

app.use(deserializeUser)

app.get(ENDPOINT, (req: Request, res: Response) => {
  res.status(200).send("Back end is living!!")
})

app.use(ENDPOINT, router)

app.listen(PORT, () => {
  log.info(`Server listing on port ${PORT}`)
  connection()
})