import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('HakiArdhi Blockchain Land Registry API')
    .setDescription('Decentralized title registration, transfer workflow, and cryptographic verification engine.')
    .setVersion('1.0')
    .addTag('fabric', 'Hyperledger Fabric ledger operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Swagger UI is available at: http://localhost:3000/api`);
}
bootstrap();
