import { Injectable } from '@nestjs/common';
import {
  EmailTemplate,
  EmailTemplateDocument,
} from 'src/schemas/emailtemplate.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import CONFIG from 'src/utils/config';
import * as AdmZip from 'adm-zip';
import {BadRequestException} from '@nestjs/common';

@Injectable()
export class ApiService {
  constructor(
    @InjectModel(EmailTemplate.name)
    private emailTemplateModel: Model<EmailTemplateDocument>,
  ) { }

  async createEmailTemplate(name: string, body: string) {
    const emailTemplate = new this.emailTemplateModel({
      name: name,
      body: body,
      createdAt: Date.now()
    });

    return emailTemplate.save()
  }

  async getEmailTemplate(id: string) {
    const emailTemplate = await this.emailTemplateModel.findOne({ _id: id });

    if (!emailTemplate) {
      return -1;
    }
    return emailTemplate;
  }

  async getEmailTemplates(skip: number, limit: number) {
    const findAllEmailTemplatesQuery = this.emailTemplateModel.find().sort({ createdAt: -1 }).skip(skip);

    if (limit) {
      findAllEmailTemplatesQuery.limit(limit);
    }

    const templates = await findAllEmailTemplatesQuery;
    const count = await this.emailTemplateModel.count();

    return { templates, count };
  }


  async deleteEmailTemplate(id: string) {
    const deleted = await this.emailTemplateModel.findByIdAndDelete(id);
    return deleted;
  }

  async getTemplateNames() {
    const names = await this.emailTemplateModel.find({}, { name: 1, _id: 1 });
    return names;
  }

  async getReceiptDataString(receiptTemplate, row) {
    for (const key of Object.keys(row)) {
      receiptTemplate = receiptTemplate.replace(`{{{${key}}}}`, row[key]);
    }
    return receiptTemplate;
  }

  async generateReceipts(csvData: any[]) {
    var fs = require("fs");
    var html2pdf = require("html-pdf");
    
    try {
      const stat = fs.statSync('./tmp/archive.zip');
      const res = fs.unlinkSync('./tmp/archive.zip');
      console.log('archive zip deleted successfully');
    } catch (e) {
      console.log("No zip file found");
    }

    const paths = csvData.map(async (row, index) => {
      var receiptTemplate = fs.readFileSync("./receipts/generic2.html", "utf8");
      var html = await this.getReceiptDataString(receiptTemplate, row);
      var options = { format: "A4" };

      html2pdf.create(html, options).toFile(`./tmp/receipt_${index}.pdf`, function (err, res) {
        return `./tmp/receipts_${index}.pdf`;
      });
    });

    return paths;
  }
  
  async getEmailContent(obj) {
    const template = await this.emailTemplateModel.findOne({name: 'Generic Template 1'});
    let body = template.body as String;
    for (const key of Object.keys(obj)) {
      body = body.replace(`{{{${key}}}}`, obj[key]);
    }
    return { subject: 'Goonj Donor Receipt Email', body: body };
  }

  async sendReceipts(csvData, paths) {
    const errors = [];
    
    var fs = require('fs');

    // delete previous log file


    try {
      const stat = fs.statSync('./tmp/0_log.txt');
      const res = fs.unlinkSync('./tmp/0_log.txt');
      console.log('log file deleted successfully');
    } catch (e) {
      console.log("No log file found");
    }

    try {
      const stat = fs.statSync('./tmp/0_error.txt');
      const res = fs.unlinkSync('./tmp/0_error.txt');
      console.log('error file deleted successfully');
    } catch (e) {
      console.log("No error file found");
    }
    
    const logStream = fs.createWriteStream(`./tmp/0_log.txt`, { flags: 'a' });
    const errorStream = fs.createWriteStream(`./tmp/0_error.txt`, { flags: 'a' });

    for (const [index, obj] of csvData.entries()) {
        const { subject, body } = await this.getEmailContent(obj);
        const toSend = obj['EMAIL_TO_SEND'];

        const response = await this.sendMail(toSend, subject, body, `receipt_${index}.pdf`, `./tmp/receipt_${index}.pdf`);
        if (response == -1) {
          errors.push(toSend);
          errorStream.write(`${new Date().toLocaleDateString()}: Failed to send email to ${toSend}\n`);
        }

        logStream.write(`Successfully sent email to ${obj['NAME']}\n`);

        console.log("Successfully send to ", obj['NAME']);
    }
    errorStream.end();
    logStream.end();
    return errors;
  }

  async sendMail(toSend, subject, body, fileName, attachmentPath) {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: CONFIG.GMAIL_ID,
        pass: CONFIG.GMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: CONFIG.GMAIL_ID,
      to: toSend,
      subject: subject,
      text: body,
      attachments: [{
        filename: fileName,
        path: attachmentPath,
        contentType: 'application/pdf'
      }]};

    const res = await transporter.sendMail(mailOptions);

    if (res.err) {
      console.log(res.err);
      return -1;
    }

    return 0;
  }

  async getZip() {
    const zip = new AdmZip();
    var fs = require('fs');
    const files = await fs.readdirSync('./tmp');
    for (const file of files) {
      await zip.addLocalFile(`./tmp/${file}`);
      console.log("added", file);
    }
    // const fileName = `${Date.now}_receipts.zip`;
    zip.writeZip('./tmp/example.zip');

    return zip.toBuffer();
  }

  // async getLogFile() {
  //   const fs = require('fs');
  //   const log = fs.createReadStream('./tmp/0_log.txt');
  //   log.on('end', () => {
  //     try {
  //       fs.unlinkSync('./tmp/0_log.txt');
  //     } catch (error) {
  //       throw new BadRequestException('An error occurred while removing the file.');
  //     }
  //   });

  //   res.set({
  //     'Content-Type': 'application/pdf',
  //     'Content-Disposition': `attachment; filename="${fileName}"`,
  //   });
  //   // const log = fs.readFileSync(`./tmp/0_log.txt`);
  //   return log;
  // }
}
