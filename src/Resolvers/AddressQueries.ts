import { Address } from "../Entities/Entitties";
import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { isAuth, isEmpty } from "../Middleware/Middleware";
import { AddressIdInputType, AddressQueryResponseType, AddressResponseType, MyContext } from "./types";

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
          message: 'No address found!'
        }]
      }
    }
    return { address }
  }

  @Query(() => AddressResponseType)
  @UseMiddleware(isAuth, isEmpty)
  async getAddress(
    @Arg(`options`) options: AddressIdInputType,
    @Ctx() { req }: MyContext
  ): Promise<AddressResponseType> {

    const address = await Address.findOne({ id: options.id })
    if (!address) return { 
      errors: [{
        field: 'id',
        message: 'Invalid address id provided'
      }]
    }

    if (address.ownerId !== req.session.userId) return {
      errors: [{
        field: 'user',
        message: 'Access Denied!'
      }]
    }
      
    return { address }

  }
}