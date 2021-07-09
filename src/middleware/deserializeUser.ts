import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { get } from "lodash";


const deserializeUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = get(req, "headers.authorization", "").replace(/^Bearer\s/, "")
    if (!accessToken) return next()

    const user = verify(accessToken, process.env.ACCESS_TOKEN_SECRET as string)

    if (user) {
      // @ts-ignore
      req.user = user
      return next()
    }
    return next();
  } catch (error) {
    res.send(403).json({ message: "access token is expired" })
  }


}

export default deserializeUser