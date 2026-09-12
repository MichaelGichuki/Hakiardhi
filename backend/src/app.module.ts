import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { FabricModule } from './fabric/fabric.module.js';

@Module({
  imports: [FabricModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
