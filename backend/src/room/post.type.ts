import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PostType {
  @Field()
  id!: string;

  @Field()
  content!: string;

  @Field()
  type!: string;
}