import { verify } from "argon2"
import { FieldError } from "../Resolvers/types"

export const checkCode = (generatedCode: string | null, code: string): FieldError[] | undefined => {
  if (generatedCode !== code) return [{
    field: 'code',
    message: 'Invalid code entered!'
  }]

  return undefined
}

export const comparePassword = async (hashedPass: string, plainPass: string): Promise<FieldError[] | undefined> => {
  if (!(await verify(hashedPass, plainPass))) return [{
    field: 'password',
    message: 'Incorrect password entered!'
  }]    

  return undefined
}