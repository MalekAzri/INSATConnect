import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Document {
  @Field(() => Int)
  id!: number;

  @Field()
  title!: string;

  @Field()
  category!: string; // 'reglement' | 'circulaire' | 'formulaire'

  @Field()
  content!: string;

  @Field(() => String, { nullable: true })
  fileName!: string | null;

  @Field(() => String, { nullable: true })
  fileSize!: string | null;

  @Field()
  publishedAt!: string;
}
