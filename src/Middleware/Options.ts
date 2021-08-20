import { FieldError, MyContext } from "src/Resolvers/types"
import { MiddlewareFn } from "type-graphql"
import validator from "validator"

export const isEmpty: MiddlewareFn<MyContext> = ({ args: { options } }, next): any => {
  const errors: FieldError[] = []
  Object.keys(options).map((opt: any) => {
    if (validator.isEmpty(options[opt])) {      
      errors.push({
        field: opt,
        message: `${opt} cannot be empty!`
      })
    }
  })

  if (errors.length > 0) return { errors }

  return next()
}

export const isEmail: MiddlewareFn<MyContext> = ({ args: { options } }, next): any => {
  if (!validator.isEmail(options.email)) return {
    errors: [{
      field: 'email',
      message: 'Please provide a correct email address'
    }]
  }
  return next()
}

export const isStrongPassword: MiddlewareFn<MyContext> = ({ args: { options } }, next): any => {
  if (!validator.isStrongPassword(options.password)) return {
    errors: [{
      field: 'password',
      message: 'Please provide a strong password'
    }]
  }

  return next()
}