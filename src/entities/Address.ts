import { Field, ID, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Address extends BaseEntity {
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

  @Field()
  @Column()
  ownerId: number

  @Field(() => User)
  @ManyToOne(() => User, user => user.address, { eager: true })
  owner: User

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date
}