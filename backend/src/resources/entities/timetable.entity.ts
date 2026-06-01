import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Timetable {
  @Field(() => Int)
  id!: number;

  @Field()
  title!: string;

  @Field()
  targetYear!: string; // e.g. 'GL3', 'MPI', etc.

  @Field(() => String, { nullable: true })
  fileName!: string | null;

  @Field(() => String, { nullable: true })
  fileSize!: string | null;

  @Field()
  publishedAt!: string;

  @Field()
  scheduleJson!: string; // JSON string representing weekly schedule slots
}
