import { User } from "../entities/User";
import { Field, InputType, ObjectType } from "type-graphql";
import { Request, Response } from "express";
import redis from 'redis'

export type MyContext = {
  req: Request & { session: { userId: number } },
  res: Response,
  redisClient: redis.RedisClient
}

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

@ObjectType()
class FieldError {
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