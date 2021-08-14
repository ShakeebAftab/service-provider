import { Field, ID, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Entity()
export class User extends BaseEntity {

  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column()
  name!: string

  @Field()
  @Column({ unique: true })
  email!: string

  @Column()
  password!: string

  @Column({ default: false })

  @Field()
  verified: boolean

}