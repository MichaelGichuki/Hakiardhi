import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Gateway, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FabricService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FabricService.name);
  private gateway: Gateway;
  private client: grpc.Client;
  private contract: Contract;

  private readonly channelName = 'hakiardhichannel';
  private readonly chaincodeName = 'hakiardhi';
  private readonly mspId = 'Org1MSP';

  private readonly cryptoPath = path.resolve(
    process.env.HOME ?? '/home/hakiardhi',
    'hakiardhi/blockchain/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com'
  );

  async onModuleInit() {
    await this.initGateway();
  }

  async onModuleDestroy() {
    this.gateway?.close();
    this.client?.close();
  }

  private async initGateway(): Promise<void> {
    const certPath = path.join(this.cryptoPath, 'users/User1@org1.example.com/msp/signcerts/cert.pem');
    const keyDirPath = path.join(this.cryptoPath, 'users/User1@org1.example.com/msp/keystore');
    const tlsCertPath = path.join(this.cryptoPath, 'peers/peer0.org1.example.com/tls/ca.crt');

    const keyFiles = fs.readdirSync(keyDirPath);
    const privateKeyPath = path.join(keyDirPath, keyFiles[0]);

    const certificate = fs.readFileSync(certPath).toString();
    const privateKeyPem = fs.readFileSync(privateKeyPath).toString();
    const tlsRootCert = fs.readFileSync(tlsCertPath);

    const identity: Identity = { mspId: this.mspId, credentials: Buffer.from(certificate) };
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const signer: Signer = signers.newPrivateKeySigner(privateKey);

    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    this.client = new grpc.Client('localhost:7051', tlsCredentials, {
      'grpc.ssl_target_name_override': 'peer0.org1.example.com',
    });

    this.gateway = connect({
      client: this.client,
      identity,
      signer,
      evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
      endorseOptions: () => ({ deadline: Date.now() + 15000 }),
      submitOptions: () => ({ deadline: Date.now() + 5000 }),
      commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
    });

    const network = this.gateway.getNetwork(this.channelName);
    this.contract = network.getContract(this.chaincodeName);
    this.logger.log(`Connected to Fabric network on channel: ${this.channelName}`);
  }

  async registerTitle(parcelNumber: string, titleNumber: string, recordHash: string, ownerNationalIdHash: string) {
    await this.contract.submitTransaction(
      'LandContract:registerInitialTitle',
      parcelNumber,
      titleNumber,
      recordHash,
      ownerNationalIdHash,
    );
    return { success: true, parcelNumber, titleNumber };
  }

  async getTitle(parcelNumber: string) {
    const resultBytes = await this.contract.evaluateTransaction('LandContract:getTitle', parcelNumber);
    return JSON.parse(Buffer.from(resultBytes).toString('utf-8'));
  }

  async verifyRecord(parcelNumber: string, calculatedDbHash: string) {
    const resultBytes = await this.contract.evaluateTransaction(
      'LandContract:verifyRecord',
      parcelNumber,
      calculatedDbHash,
    );
    return JSON.parse(Buffer.from(resultBytes).toString('utf-8'));
  }
}
