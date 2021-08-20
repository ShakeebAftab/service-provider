import { User } from "../Entities/Entitties"
import { isAuthMiddleware, MyContext } from "src/Resolvers/types"
import { MiddlewareFn, NextFn } from "type-graphql"

export const isAuth: MiddlewareFn<MyContext> = async ({ context: { req } }, next): Promise<isAuthMiddleware | NextFn> => {
  const user = await User.findOne({ id: req.session.userId })
  if (!user) return {
    errors: [{
      field: 'user',
      message: 'User is not logged in!'
    }]
  }
  
  req.user = user
  return next()
}

export const isVerified: MiddlewareFn<MyContext> = async ({ context: { req } }, next): Promise<isAuthMiddleware | NextFn> => {
  if (req.user.verified) return {
    errors: [{
      field: 'user',
      message: 'User is already verified!'
    }]
  }
 
  return next()
}

export const isUser: MiddlewareFn<MyContext> = async ({ context: { req }, args: { options } }, next): Promise<isAuthMiddleware | NextFn> => {
  const user = await User.findOne({ email: options.email })
  if (!user) {
    return {
      errors: [{
        field: 'email',
        message: 'Please enter a valid user email'
      }]
    }
  }

  req.user = user
  return next()
}