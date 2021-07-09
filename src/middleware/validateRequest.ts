import { NextFunction, Response, Request } from "express";
import { AnySchema } from "yup";
import log from "../logs";

const validate = (schema: AnySchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    })
    return next()
  } catch (error) {
    log.info(error);
    return res.status(400).json({ message: error.message });
  }
}

export default validate