import { User } from "../entities/User";
import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { CreateUserInputType, UserResponseType, LoginUserInputType, MyContext, VerificationResponseType, UpdateUserPasswordInputType, ForgotPasswordInputType } from "./types";
import { hash } from "argon2";
import { DelRedisKey, GetRedisValue } from "../Utils/Redis";
import { checkCode, checkEmail, checkEmptyField, checkPassword, checkUser, checkUserByEmail, checkVerification, comparePassword } from "../Utils/UserErrors";

@Resolver()
export class UserMutationResolver {
  @Mutation(() => UserResponseType)
  async createUser(
    @Arg(`options`) options: CreateUserInputType,
    @Ctx() { req }: MyContext
  ): Promise<UserResponseType> {
    const { name, email, password } = options

    const nameError = checkEmptyField(`name`, name)
    if (nameError) return { errors: [ nameError ] }

    const emailError = checkEmail(email)
    if (emailError) return { errors: emailError }

    const passwordError = checkPassword(password)
    if (passwordError) return { errors: passwordError }

    const hashedPass = await hash(password)

    try {
      const user = await User.create({
        name: name.toLowerCase(),
        email,
        password: hashedPass
      }).save()

      req.session.userId = user.id

      return { user }
    } catch (err) {
      if (err.code === `23505`) {
        return {
          errors: [{
            field: 'email',
            message: 'User already exists'
          }]
        }
      }

      return {
        errors: [{
          field: `server`,
          message: `Server error!`
        }]
      }

    }
  }

  @Mutation(() => UserResponseType)
  async login(
    @Arg(`options`) options: LoginUserInputType,
    @Ctx() { req }: MyContext
  ): Promise<UserResponseType> {

    const { email, password } = options

    const emailError = checkEmail(email)
    if (emailError) return { errors: emailError }

    const passwordError = checkEmptyField(`password`, password)
    if (passwordError) return { errors: [ passwordError ] }

    const { errors, user } = await checkUserByEmail(email)
    if (!user) return { errors }

    const correctPassError = await  comparePassword(user.password, password)
    if (correctPassError) return { errors: correctPassError }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => UserResponseType)
  async verifyUser(
    @Arg(`code`) code: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponseType> {

    const { errors, user } = await checkUser(req.session.userId)
    if (!user) return { errors }

    const verificationError = checkVerification(user)
    if (verificationError) return { errors: verificationError }

    const generatedCode = await GetRedisValue(`${user.id}:code`)

    const codeError = checkCode(generatedCode, code.toString())
    if (codeError) return { errors: codeError }

    DelRedisKey(`${user.id}:code`)

    user.verified = true
    await user.save()

    return { user }
  }

  @Mutation(() => VerificationResponseType)
  async updateUserPassword(
    @Arg(`options`) options: UpdateUserPasswordInputType,
    @Ctx() { req }: MyContext
  ): Promise<VerificationResponseType> {

    const { oldPassword, newPassword } = options

    const { errors, user } = await checkUser(req.session.userId)
    if (!user) return { errors }

    const correctPassError = await  comparePassword(user.password, oldPassword)
    if (correctPassError) return { errors: correctPassError }

    const passwordError = checkPassword(newPassword)
    if (passwordError) return { errors: passwordError }

    const hashedPass = await hash(newPassword)
    user.password = hashedPass
    await user.save()

    return { message: 'Password changed successfully!' }
  }

  @Mutation(() => VerificationResponseType)
  async forgotPassword(
    @Arg(`options`) options: ForgotPasswordInputType,
    @Ctx() { req }: MyContext
  ): Promise<VerificationResponseType> {
    const { email, code, password } = options

    const emailError = checkEmail(email)
    if (emailError) return { errors: emailError }

    const passwordError = checkPassword(password)
    if (passwordError) return { errors: passwordError }

    const { errors, user } = await checkUserByEmail(email)
    if (!user) return { errors }

    const generatedCode = await GetRedisValue(`${email}:code`)

    const codeError = checkCode(generatedCode, code)
    if (codeError) return { errors: codeError }

    DelRedisKey(`${email}:code`)

    const hashedPass = await hash(password)
    user.password = hashedPass
    await user.save()

    req.session.userId = user.id
    return { message: 'Password changed successfully!' }

  }
}