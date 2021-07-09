import { object, ref, string } from "yup";


export const createUserSchema = object({
  body: object({
    name: string().required("Name is required"),
    password: string().required("Password is required").min(6, "Password must be at least 6 characters long").matches(/^[a-zA-Z0-9_.-]*$/, "Password can only contain Latin letters."),
    passwordConfirmation: string().oneOf([ref("password"), null], "Password must be matches"),
    email: string().email("Must be a valid email address").required("Email is required")
  })
})
export const loginUserSchema = object({
  body: object({
    password: string().required("Password is required").min(6, "Password must be at least 6 characters long").matches(/^[a-zA-Z0-9_.-]*$/, "Password can only contain Latin letters."),
    email: string().email("Must be a valid email address").required("Email is required")
  })
})