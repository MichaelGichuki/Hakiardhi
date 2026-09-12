import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { FabricService } from './fabric.service.js';

@Controller('fabric')
export class FabricController {
  constructor(
    private readonly fabricService: FabricService,
  ) {}


  // ========================================================
  // IDENTITY
  // ========================================================

  @Get('identity')
  async getIdentity() {
    return this.fabricService.getCallerIdentity();
  }


  // ========================================================
  // REGISTER PARCEL
  // LAND OFFICER
  // ========================================================

  @Post('parcels')
  async registerParcel(
    @Body()
    body: {
      parcelId: string;
      titleReference: string;
      ownerReferenceHash: string;
      recordHash: string;
      ownershipVersion: string;
    },
  ) {
    return this.fabricService.registerParcelProof(
      body.parcelId,
      body.titleReference,
      body.ownerReferenceHash,
      body.recordHash,
      body.ownershipVersion,
    );
  }


  // ========================================================
  // GET PARCEL
  // ========================================================

  @Get('parcels/:parcelId')
  async getParcel(
    @Param('parcelId') parcelId: string,
  ) {
    return this.fabricService.getParcelProof(
      parcelId,
    );
  }


  // ========================================================
  // VERIFY PARCEL HASH
  // ========================================================

  @Get('parcels/:parcelId/verify')
  async verifyParcel(
    @Param('parcelId') parcelId: string,
    @Query('hash') hash: string,
  ) {
    return this.fabricService.verifyParcelHash(
      parcelId,
      hash,
    );
  }


  // ========================================================
  // PARCEL HISTORY
  // ========================================================

  @Get('parcels/:parcelId/history')
  async getParcelHistory(
    @Param('parcelId') parcelId: string,
  ) {
    return this.fabricService.getParcelHistory(
      parcelId,
    );
  }


  // ========================================================
  // INITIATE TRANSFER
  // LAND OFFICER
  // ========================================================

  @Post('transfers')
  async initiateTransfer(
    @Body()
    body: {
      transferId: string;
      parcelId: string;
      ownershipVersion: string;
      sourceRecordHash: string;
      newOwnerReferenceHash: string;
    },
  ) {
    return this.fabricService.initiateTransfer(
      body.transferId,
      body.parcelId,
      body.ownershipVersion,
      body.sourceRecordHash,
      body.newOwnerReferenceHash,
    );
  }


  // ========================================================
  // GET TRANSFER
  // ========================================================

  @Get('transfers/:transferId')
  async getTransfer(
    @Param('transferId') transferId: string,
  ) {
    return this.fabricService.getTransfer(
      transferId,
    );
  }


  // ========================================================
  // CONFIRM TRANSFER
  // ========================================================

  @Post('transfers/:transferId/confirm')
  async confirmTransfer(
    @Param('transferId') transferId: string,
  ) {
    return this.fabricService.confirmTransfer(
      transferId,
    );
  }


  // ========================================================
  // VERIFY TRANSFER
  // VERIFICATION OFFICER
  // ========================================================

  @Post('transfers/:transferId/verify')
  async verifyTransfer(
    @Param('transferId') transferId: string,
  ) {
    return this.fabricService.verifyTransfer(
      transferId,
    );
  }


  // ========================================================
  // APPROVE TRANSFER
  // REGISTRAR
  // ========================================================

  @Post('transfers/:transferId/approve')
  async approveTransfer(
    @Param('transferId') transferId: string,

    @Body()
    body: {
      completedRecordHash: string;
    },
  ) {
    return this.fabricService.approveTransfer(
      transferId,
      body.completedRecordHash,
    );
  }


  // ========================================================
  // REJECT TRANSFER
  // REGISTRAR
  // ========================================================

  @Post('transfers/:transferId/reject')
  async rejectTransfer(
    @Param('transferId') transferId: string,
  ) {
    return this.fabricService.rejectTransferByRegistrar(
      transferId,
    );
  }


  // ========================================================
  // TRANSFER HISTORY
  // ========================================================

  @Get('transfers/:transferId/history')
  async getTransferHistory(
    @Param('transferId') transferId: string,
  ) {
    return this.fabricService.getTransferHistory(
      transferId,
    );
  }
}
