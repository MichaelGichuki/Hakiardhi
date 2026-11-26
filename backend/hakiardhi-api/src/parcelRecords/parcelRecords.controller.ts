import {
  BadRequestException,
  Body,
  Controller,
  Cookies,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ParcelRecordsService } from './parcelRecords.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { CreateParcelDto, InitiatedTransferResult } from './parcelrecords.types.js';
import { COOKIE_NAME } from '../auth/auth.controller.js';
import type { Request, Response } from 'express';

const uploadPath = join(process.cwd(), 'uploads');

// Create uploads directory if it doesn't exist
if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

@Controller('parcelRecords')
export class ParcelRecordsController {
  constructor(private readonly parcelService: ParcelRecordsService) {}

  @Get('')
  async SearchParcels(@Query('search') search: string) {
    return this.parcelService.SearchPercel(search);
  }

  @Get('/test')
  async test() {
    // return this.parcelService.Initialtitle('KJD/LOI/4581');
    return this.parcelService.GetBlockchainTitleRecord('KJD/LOI/4581');
  }

  @Post('/upload-support')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadPath,

        filename: (req: any, file: any, callback: any) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

          callback(null, `${uniqueName}${extname(file.originalname)}`);
        },
      }),

      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (type == '' || type == null) {
      throw new BadRequestException('Invalid document type ');
    }

    return await this.parcelService.UpladSupportDocument(file.filename, type);
  }

  @Post('/trasfer')
  async transferRecord(
    @Body() data: InitiatedTransferResult,
    @Cookies(COOKIE_NAME) refreshToken: string,
  ) {
    const [sessionId, secret, ...extra] = refreshToken.split('.');
    await this.parcelService.Transfer(data, sessionId);
  }

  @Get('/sync')
  async syncRecord(){
    await this.parcelService.SyncToBlockchain()
  }

  @Post('/create-parcel')
  async Createparcel(
    @Body() data: CreateParcelDto,
  ) {
    return await this.parcelService.CreateParcelRecord(data);
  }

  @Get('/check-tamper/:id')
  async checkTamper(@Param('id') id: string) {
    return this.parcelService.CheckTamper(id);
  }

  @Get(':id')
  async getParcelRecord(@Param('id') id: string) {
    return this.parcelService.GetParcelRecord(id);
  }
}
