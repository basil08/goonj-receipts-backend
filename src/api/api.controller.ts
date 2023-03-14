import { Controller, Delete, NotFoundException, Query } from '@nestjs/common';
import { ApiService } from './api.service';
import {
  BadRequestException,
  Body,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserAuthGuard } from 'src/auth/passport/user-auth.guard';

@Controller('api')
@UseGuards(UserAuthGuard)
export class ApiController {
  constructor(private readonly apiService: ApiService) { }

  @Post('createEmailTemplate')
  async createEmailTemplate(@Body() _body) {
    const { name, body } = _body;
    return this.apiService.createEmailTemplate(name, body);
  }

  @Get('getEmailTemplate')
  async getEmailTemplate(@Query('id') id: string) {
    const e = await this.apiService.getEmailTemplate(id);
    if (e == -1) {
      return new NotFoundException('No such email exists');
    }
    return e;
  }

  @Get('getEmailTemplates')
  async getEmailTemapltes(@Query('skip') skip: number, @Query('limit') limit: number) {
    return this.apiService.getEmailTemplates(skip, limit);
  }

  @Delete('deleteEmailTemplate')
  async deleteEmailTemplate(@Query('id') id: string) {
    return this.apiService.deleteEmailTemplate(id);
  }
}
