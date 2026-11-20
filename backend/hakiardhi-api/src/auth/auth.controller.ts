import {
  Body,
  Controller,
  Cookies,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from '../gaurds/jwt-auth.guard.js';
import type { Signin, SignUp } from './auth.types.js';
import type { Request, Response } from 'express';

const COOKIE_NAME = 'refresh_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/auth',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: SignUp) {
    return this.auth.signup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: Signin,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.signin(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie(COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local',
      sameSite: 'none', // Use 'lax' if frontend and API are same-site
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    result.refreshToken = "";
    
    return result
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const result = await this.auth.refresh(refreshToken);

    this.setRefreshCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
    };
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async GetProfile(
    @Req() req: Request,
    @Cookies(COOKIE_NAME) refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // console.log("cookie:", resetCookie);
    // const refreshToken = req.cookies?.[COOKIE_NAME];
    // console.log("Refesh Token:", refreshToken);
    

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    
    return this.auth.currentProfile(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (refreshToken) {
      await this.auth.logout(refreshToken);
    }

    this.clearRefreshCookie(res);

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // await this.auth.logoutAll(req.user.userId);

    this.clearRefreshCookie(res);

    return { message: 'All sessions revoked' };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(COOKIE_NAME, token, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  }
}
