import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { UserResponseType, MyContext, VerificationResponseType, GetForgotPasswordInputType } from "./types";
import { SendVerificationMail } from "../Utils/Mailer";
import { SetRedisValue } from "../Utils/Redis";
import { isAuth, isUser, isVerified, isEmail } from "../Middleware/Middleware";

@Resolver()
export class UserQueryResolver {
  @Query(() => UserResponseType)
  @UseMiddleware(isAuth)
  async getMe(@Ctx() { req }: MyContext): Promise<UserResponseType> {
    return { user: req.user }
  }

  @Query(() => VerificationResponseType)
  @UseMiddleware(isAuth, isVerified)
  async getVerificationCode(@Ctx() { req }: MyContext): Promise<VerificationResponseType> {
    const user = req.user

    const randomCode = Math.floor(100000 + Math.random() * 900000)
    SetRedisValue(`${user.id}:code`, 300, randomCode.toString())
    SendVerificationMail(user.email, randomCode, true)

    return { message: `Verification code has been sent to the email: ${user.email}` }
  }

  @Query(() => VerificationResponseType)
  @UseMiddleware(isUser, isEmail)
  async getForgotPasswordCode(@Arg(`options`) options: GetForgotPasswordInputType): Promise<VerificationResponseType> {
    const { email } = options
    const randomCode = Math.floor(100000 + Math.random() * 900000)
    SetRedisValue(`${email}:code`, 300, randomCode.toString())
    SendVerificationMail(email, randomCode, false)

    return { message: `Email successfully sent!` }
  }

}