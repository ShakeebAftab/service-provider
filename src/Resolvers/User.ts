import { User } from "../entities/User";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { CreateUserInputType, UserResponseType, LoginUserInputType, MyContext, VerificationResponseType, UpdateUserPasswordInputType, ForgotPasswordInputType } from "./types";
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
    SendVerificationMail(user.email, randomCode, true)

    return { message: `Verification code has been sent to the email: ${user.email}` }

  }

  @Query(() => VerificationResponseType)
  async getForgotPasswordCode(
    @Arg(`email`) email: string,
    @Ctx() { redisClient }: MyContext
  ): Promise<VerificationResponseType> {

    if (!validator.isEmail(email) || validator.isEmpty(email)) {
      return {
        errors: [{
          field: 'email',
          message: 'Please enter a valid email'
        }]
      }
    }

    const randomCode = Math.floor(100000 + Math.random() * 900000)
    redisClient.setex(`${email}:code`, 300, randomCode.toString())
    SendVerificationMail(email, randomCode, false)

    return { message: `Email successfully sent!` }
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

    redisClient.DEL(`${user.id}:code`)

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

    const user = await User.findOne({ id: req.session.userId })

    if (!user) {
      return {
        errors: [{
          field: 'user',
          message: 'User is not logged in!'
        }]
      }
    }

    if (!(await verify(user.password, oldPassword))) {
      return {
        errors: [{
          field: 'oldPassword',
          message: 'Invalid old password entered!'
        }]
      }
    }

    if (newPassword.length < 8) {
      return {
        errors: [{
          field: 'newPassword',
          message: 'Password must be atleast 8 characters'
        }]
      }
    }

    const hashedPass = await hash(newPassword)
    user.password = hashedPass
    await user.save()

    return { message: 'Password changed successfully!' }
  }

  @Mutation(() => VerificationResponseType)
  async forgotPassword(
    @Arg(`options`) options: ForgotPasswordInputType,
    @Ctx() { req, redisClient }: MyContext
  ): Promise<VerificationResponseType> {
    const { email, code, password } = options

    if (!validator.isEmail(email) || validator.isEmpty(email)) {
      return {
        errors: [{
          field: 'email',
          message: 'Please provide a valid email'
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
    
    const user = await User.findOne({ email })

    if (!user) {
      return {
        errors: [{
          field: 'email',
          message: 'Please provide a valid user email'
        }]
      }
    }

    const getCode = (): Promise<string | null> => new Promise((res, rej) => {
      redisClient.get(`${email}:code`, async (err, data) => {
        if (err) rej(err)
        res(data)
      })
    })

    const generatedCode = await getCode()   

    if (generatedCode !== code) {
      return {
        errors: [{
          field: 'code',
          message: 'Invalid code provided!'
        }]
      }
    }

    redisClient.DEL(`${email}:code`)
   
    const hashedPass = await hash(password)
    user.password = hashedPass
    await user.save()
    
    req.session.userId = user.id
    return { message: 'Password changed successfully!' }

  }

}