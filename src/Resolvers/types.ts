import { User, Address } from "../Entities/Entitties";
import { Field, ID, InputType, ObjectType } from "type-graphql";
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

//* Address Types
@InputType()
export class NewAddressInputType {
  @Field()
  name: string

  @Field()
  addr: string

  @Field()
  city: string

  @Field()
  country: string

  @Field()
  postalCode: string

  @Field()
  phone: string
}

//* Address Types
@InputType()
export class UpdateAddressInputType {

  @Field(() => ID)
  id: number

  @Field({ nullable: true })
  name: string

  @Field( { nullable: true })
  addr: string

  @Field({ nullable: true })
  city: string

  @Field( { nullable: true })
  country: string

  @Field({ nullable: true })
  postalCode: string

  @Field({ nullable: true })
  phone: string
}

@InputType()
export class DeleteAddressInputType {
  @Field(() => ID)
  id: number
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

//* Address Response Type
@ObjectType()
export class AddressResponseType {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => Address, { nullable: true })
  address?: Address
}

@ObjectType()
export class AddressQueryResponseType {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => [ Address ], { nullable: true })
  address?: Address[]
}