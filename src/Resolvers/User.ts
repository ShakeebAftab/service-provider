import { User } from "../entities/User";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { CreateUserInputType, UserResponseType, LoginUserInputType, MyContext, VerificationResponseType } from "./types";
import { hash, verify } from "argon2";
import validator from "validator";
import { SendVerificationMail } from "../Utils/Mailer";

@Resolver()
export class UserResolver {
  @Query(() => UserResponseType)
  async getMe(
    @Ctx() { req }: MyContext
  ): Promise<UserResponseType> {
    const user = await User.findOne({ id: req.session.userId })

    if (!user) {
      return {
        errors: [{
          field: 'user',
          message: 'User is not logged in'
        }]
      }
    }

    return { user }
  }

  @Query(() => VerificationResponseType)
  async getVerificationCode(
    @Ctx() { req, redisClient }: MyContext
  ): Promise<VerificationResponseType> {
    const user = await User.findOne({ id: req.session.userId })
    if (!user) {
      return {
        errors: [{
          field: 'user',
          message: 'User is not logged in!'
        }]
      }
    }

    if (user.verified) {
      return {
        errors: [{
          field: 'user',
          message: 'User already verified'
        }]
      }
    }

    const randomCode = Math.floor(100000 + Math.random() * 900000)
    redisClient.setex(`${user.id}:code`, 300, randomCode.toString())
    SendVerificationMail(user.email, randomCode)

    return {
      message: `Verification code has been sent to the email: ${user.email}`
    }

  }

  @Mutation(() => UserResponseType)
  async createUser(
    @Arg(`options`) options: CreateUserInputType,
    @Ctx() { req }: MyContext
  ): Promise<UserResponseType> {
    const { name, email, password } = options

    if (!name) {
      return {
        errors: [{
          field: 'name',
          message: 'Name field cannot be empty!'
        }]
      }
    }

    if (!validator.isEmail(email) || validator.isEmpty(email)) {
      return {
        errors: [{
          field: 'email',
          message: 'Please enter a valid email'
        }]
      }
    }

    if (password.length < 8) {
      return {
        errors: [{
          field: 'password',
          message: 'Password must be atleast 8 characters'
        }]
      }
    }

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

    if (!validator.isEmail(email) || validator.isEmpty(email)) {
      return {
        errors: [{
          field: 'email',
          message: 'Please enter a valid email'
        }]
      }
    }

    if (!password) {
      return {
        errors: [{
          field: 'password',
          message: 'Password cannot be empty'
        }]
      }
    }

    const user = await User.findOne({ email })
    if (user === undefined) {
      return {
        errors: [{
          field: 'email',
          message: "User not found!"
        }]
      }
    }

    const pass = await verify(user.password, password) 
    if (!pass) {
      return {
        errors: [{
          field: 'password',
          message: 'Incorrect password entered'
        }]
      }
    }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => UserResponseType)
  async verifyUser(
    @Arg(`code`) code: string,
    @Ctx() { req, redisClient }: MyContext
  ): Promise<UserResponseType> {

    const user = await User.findOne({ id: req.session.userId })

    if (!user) {
      return {
        errors: [{
          field: 'user',
          message: 'User is not logged in!'
        }]
      }
    }

    if (user.verified) {
      return {
        errors: [{
          field: 'user',
          message: 'User already verified'
        }]
      }
    }  

    const getCode = (): Promise<string | null> => new Promise((res, rej) => {
      redisClient.get(`${user.id}:code`, async (err, data) => {
        if (err) rej(err)
        res(data)
      })
    })

    const generatedCode = await getCode()

    if (generatedCode !== code.toString()) {
      return {
        errors: [{
          field: 'code',
          message: 'Invalid code entered!'
        }]
      }
    }

    user.verified = true
    await user.save()

    return { user }
  }
}