import { User } from "../entities/User";
import { Field, InputType, ObjectType } from "type-graphql";
import { Request, Response } from "express";
import redis from 'redis'

//* Context Type
export type MyContext = {
  req: Request & { session: { userId: number } } & { user: User }
  res: Response,
  redisClient: redis.RedisClient
}

//* Middleware Type
export type isAuthMiddleware = {
  errors: FieldError[]
}

//* Input Types
@InputType()
export class CreateUserInputType {
  @Field()
  name: string

  @Field()
  email: string

  @Field()
  password: string
}

@InputType()
export class LoginUserInputType {
  @Field()
  email: string

  @Field()
  password: string
}

@InputType()
export class UpdateUserPasswordInputType {
  @Field()
  oldPassword: string

  @Field()
  password: string
}

@InputType()
export class VerifyUserInputType {
  @Field()
  code: string
}

@InputType()
export class GetForgotPasswordInputType {
  @Field()
  email: string
}

@InputType()
export class ForgotPasswordInputType {
  @Field()
  code: string

  @Field()
  email: string

  @Field()
  password: string
}

//* Response Types
@ObjectType()
export class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
export class UserResponseType {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@ObjectType()
export class VerificationResponseType {
  @Field(() => [ FieldError ], { nullable: true })
  errors?: FieldError[]

  @Field(() => String, { nullable: true })
  message?: string
}