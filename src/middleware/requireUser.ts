import { NextFunction, Response, Request } from "express";
import { get } from "lodash";


const requireUser = async (req: Request, res: Response, next: NextFunction) => {

  const user = get(req, "user")

  if (!user) {
    return res.status(403).json({ message: "Please Login to execute this function" })

  }
  return next()
}
export default requireUser