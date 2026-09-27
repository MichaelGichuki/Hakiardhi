import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiProperty } from '@nestjs/swagger';
import { FabricService } from './fabric.service.js';

class RegisterTitleDto {
  @ApiProperty({ example: 'NAIROBI/BLOCK3/400', description: 'Unique parcel identifier' })
  parcelNumber: string;

  @ApiProperty({ example: 'TITLE-2026-400', description: 'Deed registration number' })
  titleNumber: string;

  @ApiProperty({
    example: 'd2c3b4a56789def0123456789abcdef0123456789abcdef0123456789abcdef0',
    description: 'SHA-256 hash of off-chain parcel metadata',
  })
  recordHash: string;

  @ApiProperty({
    example: 'f1e2d3c4b5a697887766554433221100ffeeddccbbaa99887766554433221100',
    description: 'SHA-256 hash of owner national ID',
  })
  ownerNationalIdHash: string;
}

class VerifyRecordDto {
  @ApiProperty({ example: 'NAIROBI/BLOCK3/400', description: 'Unique parcel identifier to verify' })
  parcelNumber: string;

  @ApiProperty({
    example: 'd2c3b4a56789def0123456789abcdef0123456789abcdef0123456789abcdef0',
    description: 'Calculated SHA-256 digest from off-chain database record',
  })
  calculatedDbHash: string;
}

class InitiateTransferDto {
  @ApiProperty({ example: 'TX-2026-001', description: 'Unique transfer tracking identifier' })
  transferId: string;

  @ApiProperty({ example: 'NAIROBI/BLOCK3/400', description: 'Parcel number to transfer' })
  parcelNumber: string;

  @ApiProperty({
    example: 'e4d3c2b1a09876543210fedcba9876543210fedcba9876543210fedcba987654',
    description: 'SHA-256 hash of buyer national ID',
  })
  buyerNationalIdHash: string;

  @ApiProperty({
    example: 'aa11bb22cc33dd44ee55ff6600112233445566778899aabbccddeeff00112233',
    description: 'SHA-256 hash of digital transfer agreement & consent document',
  })
  documentHash: string;
}

class LandownerRespondDto {
  @ApiProperty({ example: 'TX-2026-001', description: 'Transfer request identifier' })
  transferId: string;

  @ApiProperty({ example: 'CONSENTED', enum: ['CONSENTED', 'REJECTED'], description: 'Consent outcome from portal or USSD' })
  consentStatus: string;

  @ApiProperty({ example: 'Confirmed by landowner via secure portal session', description: 'Audit remark' })
  remarks: string;
}

class VerifyDocumentsDto {
  @ApiProperty({ example: 'TX-2026-001', description: 'Transfer request identifier' })
  transferId: string;

  @ApiProperty({ example: true, description: 'True if registry verification officer approves title deed & boundary checks' })
  areDocumentsVerified: boolean;

  @ApiProperty({ example: 'Physical deed match, no caveats found, boundary survey checked', description: 'Verification remarks' })
  remarks: string;
}

class ApproveTransferDto {
  @ApiProperty({ example: 'TX-2026-001', description: 'Transfer request identifier' })
  transferId: string;

  @ApiProperty({ example: 'TITLE-2026-401', description: 'New deed registration number issued to buyer' })
  newTitleNumber: string;

  @ApiProperty({
    example: '7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    description: 'New SHA-256 record hash for the buyer title record (Version 2)',
  })
  newRecordHash: string;
}

@ApiTags('fabric')
@Controller('fabric')
export class FabricController {
  constructor(private readonly fabricService: FabricService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new title on the blockchain' })
  @ApiResponse({ status: 201, description: 'Title successfully committed to Hyperledger Fabric.' })
  async registerTitle(@Body() body: RegisterTitleDto) {
    try {
      return await this.fabricService.registerTitle(
        body.parcelNumber,
        body.titleNumber,
        body.recordHash,
        body.ownerNationalIdHash,
      );
    } catch (err: any) {
      const detail = err?.details?.[0]?.message || err?.message || 'Fabric transaction failed';
      throw new HttpException({ error: detail }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('title/:parcelNumber')
  @ApiOperation({ summary: 'Query title record directly from the ledger' })
  @ApiParam({ name: 'parcelNumber', example: 'NAIROBI/BLOCK1/100' })
  @ApiResponse({ status: 200, description: 'Returns active ledger title state.' })
  async getTitle(@Param('parcelNumber') parcelNumber: string) {
    try {
      return await this.fabricService.getTitle(decodeURIComponent(parcelNumber));
    } catch (err: any) {
      const detail = err?.details?.[0]?.message || err?.message || 'Parcel not found';
      throw new HttpException({ error: detail }, HttpStatus.NOT_FOUND);
    }
  }

  @Post('verify')
  @ApiOperation({ summary: 'Cryptographically verify record integrity and check for tampering' })
  @ApiResponse({ status: 200, description: 'Returns boolean validation result comparing on-chain and off-chain hashes.' })
  async verifyRecord(@Body() body: VerifyRecordDto) {
    try {
      return await this.fabricService.verifyRecord(body.parcelNumber, body.calculatedDbHash);
    } catch (err: any) {
      const detail = err?.details?.[0]?.message || err?.message || 'Verification failed';
      throw new HttpException({ error: detail }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('transfer/initiate')
  @ApiOperation({ summary: 'Initiate a title transfer (locks title to UNDER_TRANSFER)' })
  @ApiResponse({ status: 201, description: 'Transfer created and title locked against double-allocation.' })
  async initiateTransfer(@Body() body: InitiateTransferDto) {
    try {
      return await this.fabricService.initiateTransfer(
        body.transferId,
        body.parcelNumber,
        body.buyerNationalIdHash,
        body.documentHash,
      );
    } catch (err: any) {
      const detail = err?.details?.[0]?.message || err?.message || 'Failed to initiate transfer';
      throw new HttpException({ error: detail }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('transfer/landowner-respond')
  @ApiOperation({ summary: 'Record landowner response via Portal or USSD' })
  @ApiResponse({ status: 201, description: 'Landowner consent updated on-chain.' })
  async landownerRespond(@Body() body: LandownerRespondDto) {
    try {
      return await this.fabricService.landownerRespond(
        body.transferId,
        body.consentStatus,
        body.remarks,
      );
    } catch (err: any) {
      const detail = err?.details?.[0]?.message || err?.message || 'Consent submission failed';
      throw new HttpException({ error: detail }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('transfer/verify-documents')
  @ApiOperation({ summary: 'Verification officer validates land documents and physical deed' })
  @ApiResponse({ status: 201, description: 'Document verification audit logged on-chain.' })
  async verifyDocuments(@Body() body: VerifyDocumentsDto) {
    try {
      return await this.fabricService.verifyDocuments(
        body.transferId,
        body.areDocumentsVerified,
        body.remarks,
      );
    } catch (err: any) {
      const detail = err?.details?.[0]?.message || err?.message || 'Document verification failed';
      throw new HttpException({ error: detail }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('transfer/approve')
  @ApiOperation({ summary: 'Registrar approves transfer (supersedes old title, issues Version 2)' })
  @ApiResponse({ status: 201, description: 'Transfer finalized, previous title superseded, new title created.' })
  async approveTransfer(@Body() body: ApproveTransferDto) {
    try {
      return await this.fabricService.approveTransfer(
        body.transferId,
        body.newTitleNumber,
        body.newRecordHash,
      );
    } catch (err: any) {
      const detail = err?.details?.[0]?.message || err?.message || 'Approval failed';
      throw new HttpException({ error: detail }, HttpStatus.BAD_REQUEST);
    }
  }
}
