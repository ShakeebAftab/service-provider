import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { UserResponseType, MyContext, VerificationResponseType } from "./types";
import { SendVerificationMail } from "../Utils/Mailer";
import { SetRedisValue } from "../Utils/Redis";
import { checkEmail, checkUser, checkUserByEmail, checkVerification } from "../Utils/UserErrors";

@Resolver()
export class UserQueryResolver {
  @Query(() => UserResponseType)
  async getMe(@Ctx() { req }: MyContext): Promise<UserResponseType> {
    const { errors, user } = await checkUser(req.session.userId)
    if (!user) return { errors }
    return { user }
  }

  @Query(() => VerificationResponseType)
  async getVerificationCode(@Ctx() { req }: MyContext): Promise<VerificationResponseType> {
    const { errors, user } = await checkUser(req.session.userId)
    if (!user) return { errors }

    const verificationError = checkVerification(user)
    if (verificationError) return { errors: verificationError }

    const randomCode = Math.floor(100000 + Math.random() * 900000)
    SetRedisValue(`${user.id}:code`, 300, randomCode.toString())
    SendVerificationMail(user.email, randomCode, true)

    return { message: `Verification code has been sent to the email: ${user.email}` }
  }

  @Query(() => VerificationResponseType)
  async getForgotPasswordCode(@Arg(`email`) email: string): Promise<VerificationResponseType> {

    const emailError = checkEmail(email)
    if (emailError) return { errors: emailError }

    const { errors, user } = await checkUserByEmail(email)
    if (!user) return { errors }

    const randomCode = Math.floor(100000 + Math.random() * 900000)
    SetRedisValue(`${email}:code`, 300, randomCode.toString())
    SendVerificationMail(email, randomCode, false)

    return { message: `Email successfully sent!` }
  }

}