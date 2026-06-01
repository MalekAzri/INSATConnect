import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Grade {
  @Field(() => Int)
  id!: number;

  @Field()
  title!: string;

  @Field()
  targetYear!: string; // e.g. 'GL3'

  @Field()
  publishedAt!: string;

  @Field()
  gradesJson!: string; // JSON string representing array of subject grades
}
