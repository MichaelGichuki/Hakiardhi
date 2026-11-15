import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service.js';


@Controller('auth')
export class AuthController{
    
    constructor(private readonly auth: AuthService){}

      @Get()
      getHello() {
        return this.auth.findAll();
      }
}