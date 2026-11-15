import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.js';
import { ConfigService } from '@nestjs/config';



@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    const dbConnection = configService.get<string>('DATABASE_URL');
    console.log("connection string:", dbConnection)
    const adapter = new PrismaPg({
      connectionString: dbConnection,
      ssl: {
        rejectUnauthorized: false,
      }, 
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}