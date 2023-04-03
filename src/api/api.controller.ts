import { Controller, Delete, NotFoundException, Query, Res, StreamableFile, UseInterceptors } from '@nestjs/common';
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
import { ResponseAddContentDispositionAndContentTypeInterceptor } from 'src/interceptors/add-zip-headers.interceptor';
import * as AdmZip from 'adm-zip';

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

  @Get('getTemplateNames')
  async getTemplateNames() {
    return this.apiService.getTemplateNames();
  }

  @Post('generateAndSendReceipts')
  async generateAndSendReceipts(@Body() _body) {
    // take csvData array
    // for each elem in array, generate the corresponding email text
    // for each elem in array, generate a PDF using jsPDF
    // make a zip of all PDFs
    // send exit status to user
    const { csvData } = _body;

    console.log(csvData);

    const paths = await this.apiService.generateReceipts(csvData);

    const status = await this.apiService.sendReceipts(csvData, paths);

    // global.window = { document: { createElementNS: () => { return {} } } };
    // global.window = null;
    // global.navigator = null;
    // global.html2pdf = {};
    // global.btoa = null;
    
    // import fs from "fs";
   
    // fs.writeFileSync('./tmp/document.pdf', data, 'binary');

    // const { csvData, templateMapping } = _body;
    
    // for (const data of csvData) {
    //   const templateId = templateMapping[csvData['Purpose']];
    //   // emailText = getEmailText(data, templateId);
    // }
    // console.log(csvData);
    // delete global.window;
    // delete global.html2pdf;
    // delete global.navigator;
    // delete global.btoa;
    return { msg: "ok", status: status };   
  }

  @Get('getZip')
  @UseInterceptors(ResponseAddContentDispositionAndContentTypeInterceptor)
  async getZip(@Res() res) {
    // return this.apiService.getZip();

    const zip = new AdmZip();
    const fs = require('fs');
    const path = require('path');
    const files = await fs.readdirSync('./tmp');
    for (const file of files) {
      await zip.addLocalFile(`./tmp/${file}`);
      console.log("added", file);
    }
    // const fileName = `${Date.now}_receipts.zip`;
    zip.writeZip('./tmp/archive.zip');
    return res.sendFile(
      path.join(__dirname, '../../tmp', 'archive.zip')
    );

  }

  @Get('getLog')
  getLog(@Res() res) {
    const path = require('path');
    // const log = fs.createReadStream('./tmp/0_log.txt', 'utf8');
    // log.on('end', () => {
    //   try {
    //     fs.unlinkSync('./tmp/0_log.txt');
    //   } catch (error) {
    //     throw new BadRequestException('An error occurred while removing the file.');
    //   }
    // });

    // res.set({
    //   'Content-Type': 'text/plain',
    //   'Content-Disposition': `attachment; filename="log.txt"`,
    // });
    // return new StreamableFile(log);

    // const log = fs.readFileSync('./tmp/0_log.txt');

    return res.sendFile(
      path.join(__dirname, '../../tmp', '0_log.txt')
    );
    // return this.apiService.getLogFile();
  }

  @Get('getError')
  getError(@Res() res) {
    const path = require('path');

    return res.sendFile(
      path.join(__dirname, '../../tmp', '0_error.txt')
    );
  }

}
