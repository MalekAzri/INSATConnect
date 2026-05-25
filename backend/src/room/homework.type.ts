import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class HomeworkType {
  @Field()
  id!: string;

  @Field()
  title!: string;

  @Field()
  description!: string;
}