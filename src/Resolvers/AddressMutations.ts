import { Address } from "../Entities/Entitties";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { isAuth, isEmpty } from "../Middleware/Middleware";
import { NewAddressInputType, AddressResponseType, MyContext, UpdateAddressInputType, VerificationResponseType, DeleteAddressInputType } from "./types";

@Resolver()
export class AddressMutationResolver {
  @Mutation(() => AddressResponseType)
  @UseMiddleware(isAuth, isEmpty)
  async addNewAddress(
    @Arg(`options`) options: NewAddressInputType,
    @Ctx() { req }: MyContext
  ): Promise<AddressResponseType> {
    try {
      const { id } = await Address.create({
        ...options,
        ownerId: req.session.userId
      }).save()

      const address = await Address.findOne({ id })

      return { address }
    } catch (err) {
      console.log(err)
      return {
        errors: [{
          field: 'address',
          message: 'Unable to add new address!'
        }]
      }
    }
  }

  @Mutation(() => AddressResponseType)
  @UseMiddleware(isAuth)
  async updateAddress(
    @Arg(`options`) options: UpdateAddressInputType,
    @Ctx() { req }: MyContext
  ): Promise<AddressResponseType> {
    const address: any = await Address.findOne({ id: options.id })

    if (!address) {
      return {
        errors: [{
          field: 'id',
          message: 'Unable to find the address'
        }]
      }
    }

    if (address.ownerId !== req.session.userId) {
      return {
        errors: [{
          field: 'user',
          message: 'Access Denied!'
        }]
      }
    }

    Object.keys(options).map((opt) => { if (options[opt as keyof UpdateAddressInputType]) address[opt] = options[opt as keyof UpdateAddressInputType] })
    await address.save()
    return { address }
  }

  @Mutation(() => VerificationResponseType)
  @UseMiddleware(isAuth, isEmpty)
  async delAddess(
    @Arg(`options`) options: DeleteAddressInputType,
    @Ctx() { req }: MyContext
  ): Promise<VerificationResponseType> {  
    const address = await Address.findOne({ id: options.id })

    if (!address) {
      return {
        errors: [{
          field: 'id',
          message: 'Address not found!'
        }]
      }
    }

    if (address.ownerId !== req.user.id) {
      return {
        errors: [{
          field: 'user',
          message: 'Access Denied!'
        }]
      }
    }

    await address.remove()
    return { message: 'Address removed successfully' }
  }

}