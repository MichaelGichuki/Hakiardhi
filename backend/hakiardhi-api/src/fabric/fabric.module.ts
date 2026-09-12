import { Module } from '@nestjs/common';

import { FabricService } from './fabric.service.js';
import { FabricController } from './fabric.controller.js';

@Module({
  controllers: [
    FabricController,
  ],

  providers: [
    FabricService,
  ],

  exports: [
    FabricService,
  ],
})
export class FabricModule {}
