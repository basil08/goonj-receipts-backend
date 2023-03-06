import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLocalGuard } from './passport/user-local.guard';
import { Request as ExpressRequest } from 'express';
import { UserAuthGuard } from './passport/user-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('createUser')
  async createUser(@Body() _body) {
    const { name, email, password } = _body;
    const u = await this.authService.createUser(name, email, password);
    if (u === 1) {
      throw new BadRequestException('Email already exists');
    }
    return 'User sucessfully created';
  }

  @UseGuards(UserLocalGuard)
  @Post('loginUser')
  async loginUser(@Req() req: ExpressRequest) {
    return this.authService.loginUser(req['user']);
  }

  @UseGuards(UserAuthGuard)
  @Get('userProfile')
  async userProfile(@Req() req: ExpressRequest) {
    return req['user'];
  }
}
