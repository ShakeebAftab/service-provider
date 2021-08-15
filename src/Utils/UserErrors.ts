import { verify } from "argon2"
import validator from "validator"
import { User } from "../entities/User"
import { FieldError, UserResponseType } from "../Resolvers/types"

export const checkUser = async (id: number): Promise<UserResponseType> => {
  const user = await User.findOne({ id })

  if (!user) return {
    errors: [{
      field: 'user',
      message: 'User is not logged in!'
    }],
    user: undefined
  }
    
  return { user }
}

export const checkUserByEmail = async (email: string): Promise<UserResponseType> => {
  const user = await User.findOne({ email })

  if (!user) return {
    errors: [{
      field: 'user',
      message: 'User not found!'
    }],
    user: undefined
  }
    
  return { user }

}

export const checkVerification = (user: User): FieldError[] | undefined => {
  if (user.verified) return [{
    field: 'user',
    message: 'User already verified'
  }]

  return undefined
}

export const checkEmail = (email: string): FieldError[] | undefined => {
  if (!validator.isEmail(email) || validator.isEmpty(email)) return [{
    field: 'email',
    message: 'Please enter a valid email'
  }]    

  return undefined
}

export const checkEmptyField = (fieldName: string, value: string): FieldError | undefined => {
  if (!value) return {
    field: `${fieldName}`,
    message: `${fieldName} cannnot be empty`
  }
    
  return undefined
}

export const checkPassword = (password: string): FieldError[] | undefined => {
  if (!validator.isStrongPassword(password)) return [{
    field: 'password',
    message: 'Please enter a strong password!'
  }]

  return undefined
}

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