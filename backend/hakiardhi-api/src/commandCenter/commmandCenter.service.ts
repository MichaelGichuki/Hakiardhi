import { Injectable } from '@nestjs/common';
import {
  AuditDash,
  CommandCenterResponse,
  ProcessQueueDetails,
  TransactionHistory,
} from './commmandCenter.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CommandCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async CommandcenterDetails(): Promise<CommandCenterResponse> {
    const verifiedParcels = await this.prisma.inspectionLog.count();
    const pending = (
      await this.prisma.transactionHistory.findMany({
        where: {
          stage: {
            not: 'Completed',
            mode: 'insensitive',
          },
        },
      })
    ).length;

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
    const completedToday = (
      await this.prisma.transactionHistory.findMany({
        where: {
          stage: {
            contains: 'Completed',
            mode: 'insensitive',
          },
          updateAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
      })
    ).length;

    const awaiting = (
      await this.prisma.requestLogs.findMany({
        where: {
          user: {
            role: {
              contains: 'Landowner',
            },
          },
          status: {
            equals: null,
          },
        },
      })
    ).length;

    const queue = (
      await this.prisma.transactionHistory.findMany({
        where: {
          stage: {
            not: 'Completed',
          },
        },
        select: {
          refrerence: true,
          landparcel: {
            select: {
              parcelNumber: true,
            },
          },
          stage: true,
        },
      })
    ).map<ProcessQueueDetails>((value) => ({
      parcel: value.landparcel.parcelNumber,
      priority: 'Low',
      refernce: value.refrerence,
      stage: value.stage,
    }));

    return {
      dashDetails: {
        awaitingOwnerConcent: awaiting,
        completedToday: completedToday,
        pendingtransfers: pending,
        verifiedParecels: verifiedParcels,
      },
      logs: [],
      processQueue: queue,
    };
  }

  async AuditTraial(): Promise<AuditDash> {
    const transactions = await this.prisma.transactionHistory.count();

    const intergrity = await this.prisma.inspectionLog.count({
      where: {
        verdict: {
          contains: 'tamper',
          mode: 'insensitive',
        },
      },
    });

    return {
      currentBlock: transactions / 4,
      integrityIssues: intergrity,
      ledgerTransactions: transactions,
      networkPeers: 4,
    };
  }

  async TransactionHistory(search: string): Promise<TransactionHistory[]> {
    const list = await this.prisma.transactionHistory.findMany({
      select: {
        actor: {
          select: {
            name: true,
          },
        },
        action: true,
        refrerence: true,
        stage: true,
        createdAt: true,
        id: true,
      },
      where: {
        actor : {
            name: {
                contains: search,
                mode: 'insensitive'
            }
        },
        stage: {
            contains: search,
            mode: 'insensitive' 
        }
      }
    });

    return list.map<TransactionHistory>((value) => ({
      action: value.action,
      actor: value.actor.name ?? "",
      reference: value.refrerence,
      status: value.stage,
      timestamp: value.createdAt,
      transactionsId: value.id,
    }));
  }
}
