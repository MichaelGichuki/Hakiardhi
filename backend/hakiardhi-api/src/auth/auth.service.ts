import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Signin, SignUp } from './auth.types.js';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private jwt: JwtService) {}

  async findAll() {
    return await this.prisma.user.findFirst();
  }

  async signup(data: SignUp){
    await this.prisma.user.create({
      data: {
        email: data.email,
        role: data.role,
        name: data.name,
        password: await this.hashPassword(data.password)
      }
    })

    return "Created";
  }

  async signin(data: Signin, metadata: { ip?: string; userAgent?: string }){

     const user = await this.prisma.user.findFirst({
      where: {email: data.email}
     })

     if (user == null){
      throw new UnauthorizedException();
     }
     const isAuth = this.verifyPassword(data.password, user?.password ?? "");
     if (!isAuth){
      throw new UnauthorizedException();
     }

     return this.createSession(user.id, metadata);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  async verifyPassword(password: string, hash: string) {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  }

  private async createSession(
    userId: string,
    metadata: { ip?: string; userAgent?: string },
  ) {
    const secret = randomBytes(32).toString('hex');
    const refreshTokenHash = await argon2.hash(secret);


    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + SESSION_DURATION),
        ipAddress: metadata.ip,
        userAgent: metadata.userAgent,
      },
    });

    const accessToken = await this.generateAccessToken(
      userId,
      session.id,
    );

    return {
      accessToken,
      refreshToken: `${session.id}.${secret}`,
    };
  }

  // GENERATE ACCESS TOKEN
  private async generateAccessToken(
    userId: string,
    sessionId: string,
  ) {
    return this.jwt.signAsync(
      {
        sub: userId,
        sid: sessionId,
      },
      {
        expiresIn: '15m',
      },
    );
  }

  // REFRESH TOKEN
  async refresh(refreshToken: string) {
    const [sessionId, secret, ...extra] = refreshToken.split('.');

    if (!sessionId || !secret || extra.length > 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Session expired');
    }

    const valid = await argon2.verify(
      session.refreshTokenHash,
      secret,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate refresh token
    const newSecret = randomBytes(32).toString('hex');
    const newHash = await argon2.hash(newSecret);

    // Atomic compare-and-swap prevents concurrent reuse.
    const updated = await this.prisma.session.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        refreshTokenHash: newHash,
        lastUsedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new UnauthorizedException('Refresh token already used');
    }

    const accessToken = await this.generateAccessToken(
      session.userId,
      session.id,
    );

    return {
      accessToken,
      refreshToken: `${session.id}.${newSecret}`,
    };
  }

  // LOGOUT CURRENT DEVICE
  async logout(refreshToken: string) {
    const [sessionId, secret, ...extra] = refreshToken.split('.');

    if (!sessionId || !secret || extra.length > 0) {
      return;
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.revokedAt) return;

    const valid = await argon2.verify(
      session.refreshTokenHash,
      secret,
    );

    if (!valid) return;

    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // LOGOUT ALL DEVICES
  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

}
