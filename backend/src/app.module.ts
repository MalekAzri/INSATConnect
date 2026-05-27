import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtService } from '@nestjs/jwt';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';

import { AdminAgentModule } from './admin-agent/admin-agent.module';
import { StudentAgentModule } from './student-agent/student-agent.module';
import { TeacherModule } from './teacher/teacher.module';
import { TeacherService } from './teacher/teacher.service';
import { AuthModule } from './auth/auth.module';
import { createApolloResolvers } from './graphql-resolvers/general-resolvers';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [PrismaModule, TeacherModule, AuthModule],
      inject: [PrismaService, TeacherService, JwtService],
      useFactory: (
        prismaService: PrismaService,
        teacherService: TeacherService,
        jwtService: JwtService,
      ) => ({
        typePaths: ['./**/*.graphql'],
        definitions: {
          path: join(process.cwd(), 'src/graphql.ts'),
          outputAs: 'class',
        },
        context: ({
          req,
        }: {
          req: {
            headers?: Record<string, string | string[] | undefined>;
            user?: {
              id: number;
              email: string;
              role: string;
              name: string;
              year?: string;
              promo?: string;
            };
          };
        }) => {
          const authHeader = req?.headers?.authorization;
          const tokenHeader = Array.isArray(authHeader)
            ? authHeader[0]
            : authHeader;

          if (tokenHeader?.startsWith('Bearer ')) {
            const token = tokenHeader.slice(7).trim();
            if (token) {
              try {
                const payload = jwtService.verify<{
                  sub: number;
                  email: string;
                  role: string;
                  name: string;
                  year?: string;
                }>(token);

                req.user = {
                  id: payload.sub,
                  email: payload.email,
                  role: payload.role,
                  name: payload.name,
                  year: payload.year,
                  promo: payload.year,
                };
              } catch {
                // Ignore invalid token here; resolvers that need auth will handle missing user.
              }
            }
          }

          return { req };
        },
        resolvers: createApolloResolvers(prismaService, teacherService),
      }),
    }),

    MessagesModule,
    ChatModule,
    PrismaModule,

    AdminAgentModule,
    StudentAgentModule,
    TeacherModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
