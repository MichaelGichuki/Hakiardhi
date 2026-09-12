import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { FabricService } from './fabric.service.js';

@Controller('fabric')
export class FabricController {
  constructor(private readonly fabricService: FabricService) {}

  @Post('register')
  async registerTitle(
    @Body() body: { parcelNumber: string; titleNumber: string; recordHash: string; ownerNationalIdHash: string }
  ) {
    return this.fabricService.registerTitle(
      body.parcelNumber,
      body.titleNumber,
      body.recordHash,
      body.ownerNationalIdHash
    );
  }

  @Get('title/:parcelNumber')
  async getTitle(@Param('parcelNumber') parcelNumber: string) {
    return this.fabricService.getTitle(decodeURIComponent(parcelNumber));
  }

  @Post('verify')
  async verifyRecord(@Body() body: { parcelNumber: string; calculatedDbHash: string }) {
    return this.fabricService.verifyRecord(body.parcelNumber, body.calculatedDbHash);
  }
}
