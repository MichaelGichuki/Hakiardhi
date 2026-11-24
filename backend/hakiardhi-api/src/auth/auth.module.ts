import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtStrategy } from "../strategies/wt.strategy.js";
import { JwtService } from "@nestjs/jwt";



@Module({
  controllers: [
    AuthController,
  ],

  providers: [
    AuthService, JwtStrategy, JwtService
  ],

  exports: [
    AuthService
  ],
})
export class AuthModule {}