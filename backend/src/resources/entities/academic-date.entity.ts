import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AcademicDate {
  @Field(() => Int)
  id!: number;

  @Field()
  key!: string;

  @Field()
  date!: string;

  @Field()
  targetRole!: string;

  @Field()
  notificationSent!: boolean;

  @Field(() => Date, { nullable: true })
  updatedAt!: Date | null;
}