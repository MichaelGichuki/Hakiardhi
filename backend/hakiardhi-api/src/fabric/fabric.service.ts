import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  connect,
  Contract,
  Gateway,
  Identity,
  Signer,
  signers,
} from '@hyperledger/fabric-gateway';

import * as grpc from '@grpc/grpc-js';
import { promises as fs } from 'fs';
import { createPrivateKey } from 'crypto';

@Injectable()
export class FabricService
  implements OnModuleInit, OnModuleDestroy
{
  private landOfficerClient!: grpc.Client;
  private verificationClient!: grpc.Client;
  private registrarClient!: grpc.Client;

  private landOfficerGateway!: Gateway;
  private verificationGateway!: Gateway;
  private registrarGateway!: Gateway;

  private landOfficerContract!: Contract;
  private verificationOfficerContract!: Contract;
  private registrarContract!: Contract;

  private readonly channelName = 'mychannel';
  private readonly chaincodeName = 'hakiardhi';

  private readonly fabricBasePath =
    '/home/ruel/Hakiardhi/blockchain/organizations/peerOrganizations';


  // ========================================================
  // NESTJS LIFECYCLE
  // ========================================================

  async onModuleInit(): Promise<void> {
    await this.connectLandOfficer();
    await this.connectVerificationOfficer();
    await this.connectRegistrar();

    console.log(
      'All HakiArdhi Fabric identities connected successfully',
    );
  }


  async onModuleDestroy(): Promise<void> {
    if (this.landOfficerGateway) {
      this.landOfficerGateway.close();
    }

    if (this.verificationGateway) {
      this.verificationGateway.close();
    }

    if (this.registrarGateway) {
      this.registrarGateway.close();
    }

    if (this.landOfficerClient) {
      this.landOfficerClient.close();
    }

    if (this.verificationClient) {
      this.verificationClient.close();
    }

    if (this.registrarClient) {
      this.registrarClient.close();
    }
  }


  // ========================================================
  // GENERIC FABRIC CONNECTION HELPER
  // ========================================================

  private async createFabricConnection(
    mspId: string,
    peerEndpoint: string,
    peerHostAlias: string,
    tlsCertPath: string,
    certPath: string,
    keyPath: string,
  ): Promise<{
    client: grpc.Client;
    gateway: Gateway;
    contract: Contract;
  }> {

    const tlsRootCert =
      await fs.readFile(tlsCertPath);

    const tlsCredentials =
      grpc.credentials.createSsl(
        tlsRootCert,
      );

    const client =
      new grpc.Client(
        peerEndpoint,
        tlsCredentials,
        {
          'grpc.ssl_target_name_override':
            peerHostAlias,

          'grpc.default_authority':
            peerHostAlias,
        },
      );

    const credentials =
      await fs.readFile(certPath);

    const identity: Identity = {
      mspId,
      credentials,
    };

    const privateKeyPem =
      await fs.readFile(keyPath);

    const privateKey =
      createPrivateKey(
        privateKeyPem,
      );

    const signer: Signer =
      signers.newPrivateKeySigner(
        privateKey,
      );

    const gateway =
      connect({
        client,
        identity,
        signer,
      });

    const network =
      gateway.getNetwork(
        this.channelName,
      );

    const contract =
      network.getContract(
        this.chaincodeName,
      );

    return {
      client,
      gateway,
      contract,
    };
  }


  // ========================================================
  // LAND OFFICER CONNECTION
  // Org1MSP / User1@org1.example.com
  // ========================================================

  private async connectLandOfficer(): Promise<void> {

    const orgPath =
      `${this.fabricBasePath}/landofficer.hakiardhi.local`;
    const connection =
  await this.createFabricConnection(
    'LandOfficerMSP',

    'localhost:7051',

    'peer0.landofficer.hakiardhi.local',

    `${orgPath}/peers/peer0.landofficer.hakiardhi.local/tls/ca.crt`,

    `${orgPath}/users/User1@landofficer.hakiardhi.local/msp/signcerts/User1@landofficer.hakiardhi.local-cert.pem`,

    `${orgPath}/users/User1@landofficer.hakiardhi.local/msp/keystore/priv_sk`,
  );

    this.landOfficerClient =
      connection.client;

    this.landOfficerGateway =
      connection.gateway;

    this.landOfficerContract =
      connection.contract;

    console.log(
      'LAND_OFFICER connected: User1@landofficer.hakiardhi.local/',
    );
  }


  // ========================================================
  // VERIFICATION OFFICER CONNECTION
  // Org2MSP / User1@org2.example.com
  // ========================================================

  private async connectVerificationOfficer(): Promise<void> {

    const orgPath =
      `${this.fabricBasePath}/verificationofficer.hakiardhi.local`;

    const connection =
      await this.createFabricConnection(
        'VerificationOfficerMSP',

        'localhost:8051',

        'peer0.verificationofficer.hakiardhi.local',

        `${orgPath}/peers/peer0.verificationofficer.hakiardhi.local/tls/ca.crt`,

        `${orgPath}/users/User1@verificationofficer.hakiardhi.local/msp/signcerts/User1@verificationofficer.hakiardhi.local-cert.pem`,

        `${orgPath}/users/User1@verificationofficer.hakiardhi.local/msp/keystore/priv_sk`,
      );

    this.verificationClient =
      connection.client;

    this.verificationGateway =
      connection.gateway;

    this.verificationOfficerContract =
      connection.contract;

    console.log(
      'VERIFICATION_OFFICER connected: User1@verificationofficer.hakiardhi.local',
    );
  }


  // ========================================================
  // REGISTRAR CONNECTION
  // Org2MSP / Admin@org2.example.com
  // ========================================================

  private async connectRegistrar(): Promise<void> {

    const orgPath =
      `${this.fabricBasePath}/registrar.hakiardhi.local`;

    const connection =
      await this.createFabricConnection(
        'RegistrarMSP',

        'localhost:9051',

        'peer0.registrar.hakiardhi.local',

        `${orgPath}/peers/peer0.registrar.hakiardhi.local/tls/ca.crt`,

        `${orgPath}/users/Admin@registrar.hakiardhi.local/msp/signcerts/Admin@registrar.hakiardhi.local-cert.pem`,

        `${orgPath}/users/Admin@registrar.hakiardhi.local/msp/keystore/priv_sk`,
      );

    this.registrarClient =
      connection.client;

    this.registrarGateway =
      connection.gateway;

    this.registrarContract =
      connection.contract;

    console.log(
      'REGISTRAR connected: Admin@registrar.hakiardhi.local',
    );
  }


  // ========================================================
  // CALLER IDENTITY
  // ========================================================

  async getCallerIdentity(): Promise<any> {

    const result =
      await this.landOfficerContract
        .evaluateTransaction(
          'GetCallerIdentity',
        );

    return JSON.parse(
      Buffer.from(result)
        .toString('utf8'),
    );
  }


  // ========================================================
  // REGISTER PARCEL
  // LAND_OFFICER
  // ========================================================

  async registerParcelProof(
    parcelId: string,
    titleReference: string,
    ownerReferenceHash: string,
    recordHash: string,
    ownershipVersion: string,
  ): Promise<any> {

    await this.landOfficerContract
      .submitTransaction(
        'RegisterParcelProof',
        parcelId,
        titleReference,
        ownerReferenceHash,
        recordHash,
        ownershipVersion,
      );

    return {
      success: true,

      message:
        `Parcel ${parcelId} registered successfully`,
    };
  }


  // ========================================================
  // GET PARCEL
  // ========================================================

  async getParcelProof(
    parcelId: string,
  ): Promise<any> {

    const result =
      await this.landOfficerContract
        .evaluateTransaction(
          'GetParcelProof',
          parcelId,
        );

    return JSON.parse(
      Buffer.from(result)
        .toString('utf8'),
    );
  }


  // ========================================================
  // VERIFY PARCEL HASH
  // ========================================================

  async verifyParcelHash(
    parcelId: string,
    recordHash: string,
  ): Promise<any> {

    const result =
      await this.landOfficerContract
        .evaluateTransaction(
          'VerifyParcelHash',
          parcelId,
          recordHash,
        );

    return JSON.parse(
      Buffer.from(result)
        .toString('utf8'),
    );
  }


  // ========================================================
  // PARCEL HISTORY
  // ========================================================

  async getParcelHistory(
    parcelId: string,
  ): Promise<any> {

    const result =
      await this.landOfficerContract
        .evaluateTransaction(
          'GetParcelHistory',
          parcelId,
        );

    return JSON.parse(
      Buffer.from(result)
        .toString('utf8'),
    );
  }


  // ========================================================
  // INITIATE TRANSFER
  // LAND_OFFICER
  // ========================================================

  async initiateTransfer(
    transferId: string,
    parcelId: string,
    ownershipVersion: string,
    sourceRecordHash: string,
    newOwnerReferenceHash: string,
  ): Promise<any> {

    await this.landOfficerContract
      .submitTransaction(
        'InitiateTransfer',
        transferId,
        parcelId,
        ownershipVersion,
        sourceRecordHash,
        newOwnerReferenceHash,
      );

    return {
      success: true,

      message:
        `Transfer ${transferId} initiated successfully`,
    };
  }


  // ========================================================
  // CONFIRM TRANSFER
  // LANDOWNER STEP
  // ========================================================

  async confirmTransfer(
    transferId: string,
  ): Promise<any> {

    await this.landOfficerContract
      .submitTransaction(
        'ConfirmTransfer',
        transferId,
      );

    return {
      success: true,

      message:
        `Transfer ${transferId} confirmed successfully`,
    };
  }


  // ========================================================
  // VERIFY TRANSFER
  // VERIFICATION_OFFICER
  // ========================================================

  async verifyTransfer(
    transferId: string,
  ): Promise<any> {

    await this.verificationOfficerContract
      .submitTransaction(
        'VerifyTransfer',
        transferId,
      );

    return {
      success: true,

      message:
        `Transfer ${transferId} verified successfully`,
    };
  }


  // ========================================================
  // APPROVE TRANSFER
  // REGISTRAR
  // ========================================================

  async approveTransfer(
    transferId: string,
    completedRecordHash: string,
  ): Promise<any> {

    await this.registrarContract
      .submitTransaction(
        'ApproveTransfer',
        transferId,
        completedRecordHash,
      );

    return {
      success: true,

      message:
        `Transfer ${transferId} approved successfully`,
    };
  }


  // ========================================================
  // REJECT TRANSFER BY REGISTRAR
  // ========================================================

  async rejectTransferByRegistrar(
    transferId: string,
  ): Promise<any> {

    await this.registrarContract
      .submitTransaction(
        'RejectTransferByRegistrar',
        transferId,
      );

    return {
      success: true,

      message:
        `Transfer ${transferId} rejected by registrar`,
    };
  }


  // ========================================================
  // GET TRANSFER
  // ========================================================

  async getTransfer(
    transferId: string,
  ): Promise<any> {

    const result =
      await this.landOfficerContract
        .evaluateTransaction(
          'GetTransfer',
          transferId,
        );

    return JSON.parse(
      Buffer.from(result)
        .toString('utf8'),
    );
  }


  // ========================================================
  // TRANSFER HISTORY
  // ========================================================

  async getTransferHistory(
    transferId: string,
  ): Promise<any> {

    const result =
      await this.landOfficerContract
        .evaluateTransaction(
          'GetTransferHistory',
          transferId,
        );

    return JSON.parse(
      Buffer.from(result)
        .toString('utf8'),
    );
  }
}
