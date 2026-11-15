import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { FabricModule } from './fabric/fabric.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    FabricModule,
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true, // Make config globally available
    })
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}
