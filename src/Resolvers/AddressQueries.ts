import { Address } from "../Entities/Entitties";
import { Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { isAuth } from "../Middleware/Middleware";
import { AddressQueryResponseType, MyContext } from "./types";

@Resolver()
export class AddressQueryResolver {
  @Query(() => AddressQueryResponseType)
  @UseMiddleware(isAuth)
  async getAllAddress(@Ctx() { req }: MyContext): Promise<AddressQueryResponseType> {
    const address = await Address.find({ ownerId: req.user.id })
    if (!address || address.length < 1) {
      return {
        errors: [{
          field: 'user',
          message: 'Address not found!'
        }]
      }
    }
    return { address }
  }
}