import { User } from "../entities/Entitties";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { CreateUserInputType, UserResponseType, LoginUserInputType, MyContext, VerificationResponseType, UpdateUserPasswordInputType, ForgotPasswordInputType, VerifyUserInputType } from "./types";
import { hash } from "argon2";
import { DelRedisKey, GetRedisValue } from "../Utils/Redis";
import { checkCode, comparePassword } from "../Utils/UserUtils";
import { isAuth, isVerified, isUser, isEmpty, isEmail, isStrongPassword } from "../Middleware/Middleware";

@Resolver()
export class UserMutationResolver {
  @Mutation(() => UserResponseType)
  @UseMiddleware(isEmpty, isEmail, isStrongPassword)
  async createUser(
    @Arg(`options`) options: CreateUserInputType,
    @Ctx() { req }: MyContext
  ): Promise<UserResponseType> {
    const { name, email, password } = options
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
  @UseMiddleware(isEmpty, isUser, isStrongPassword)
  async login(
    @Arg(`options`) options: LoginUserInputType,
    @Ctx() { req }: MyContext
  ): Promise<UserResponseType> {

    const { password } = options
    const user = req.user

    const correctPassError = await  comparePassword(user.password, password)
    if (correctPassError) return { errors: correctPassError }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => UserResponseType)
  @UseMiddleware(isEmpty, isAuth, isVerified)
  async verifyUser(
    @Arg(`options`) options: VerifyUserInputType,
    @Ctx() { req }: MyContext
  ): Promise<UserResponseType> {

    const { code } = options    
    const user = req.user
    const generatedCode = await GetRedisValue(`${user.id}:code`)

    const codeError = checkCode(generatedCode, code.toString())
    if (codeError) return { errors: codeError }

    DelRedisKey(`${user.id}:code`)

    user.verified = true
    await user.save()

    return { user }
  }

  @Mutation(() => VerificationResponseType)
  @UseMiddleware(isEmpty, isAuth, isStrongPassword)
  async updateUserPassword(
    @Arg(`options`) options: UpdateUserPasswordInputType,
    @Ctx() { req }: MyContext
  ): Promise<VerificationResponseType> {

    const user = req.user
    const { oldPassword, password } = options

    const correctPassError = await  comparePassword(user.password, oldPassword)
    if (correctPassError) return { errors: correctPassError }

    const hashedPass = await hash(password)
    user.password = hashedPass
    await user.save()

    return { message: 'Password changed successfully!' }
  }

  @Mutation(() => VerificationResponseType)
  @UseMiddleware(isEmpty, isUser, isStrongPassword)
  async forgotPassword(
    @Arg(`options`) options: ForgotPasswordInputType,
    @Ctx() { req }: MyContext
  ): Promise<VerificationResponseType> {
    const user = req.user
    const { email, code, password } = options

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