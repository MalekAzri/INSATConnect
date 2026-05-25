import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PostType } from './post.type';
import { HomeworkType } from './homework.type';

@ObjectType()
export class RoomType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  teacherId!: string;

  @Field(() => [PostType], { nullable: true })
  posts?: PostType[];

  @Field(() => [HomeworkType], { nullable: true })
  homeworks?: HomeworkType[];
}