import { Field, ID, ObjectType } from "type-graphql";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Entity()
export class Address {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  name: string

  @Field()
  @Column()
  addr: string

  @Field()
  @Column()
  city: string

  @Field()
  @Column()
  country: string

  @Field()
  @Column()
  postalCode: string

  @Field()
  @Column()
  phone: string
}