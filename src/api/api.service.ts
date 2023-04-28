import { Injectable } from '@nestjs/common';
import {
  EmailTemplate,
  EmailTemplateDocument,
} from '../schemas/emailtemplate.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import CONFIG from '../utils/config';
import { ToWords } from 'to-words';

@Injectable()
export class ApiService {
  constructor(
    @InjectModel(EmailTemplate.name)
    private emailTemplateModel: Model<EmailTemplateDocument>,
  ) {}

  async createEmailTemplate(name: string, body: string) {
    const emailTemplate = new this.emailTemplateModel({
      name: name,
      body: body,
      createdAt: Date.now(),
    });

    return emailTemplate.save();
  }

  async getEmailTemplate(id: string) {
    const emailTemplate = await this.emailTemplateModel.findOne({ _id: id });

    if (!emailTemplate) {
      return -1;
    }
    return emailTemplate;
  }

  async getEmailTemplates(skip: number, limit: number) {
    const findAllEmailTemplatesQuery = this.emailTemplateModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip);

    if (limit) {
      findAllEmailTemplatesQuery.limit(limit);
    }

    const templates = await findAllEmailTemplatesQuery;
    const count = await this.emailTemplateModel.count();

    return { templates, count };
  }

  async deleteEmailTemplate(id: string) {
    const deleted = await this.emailTemplateModel.findByIdAndDelete(id);
    if (deleted) return deleted;
    else return { message: 'No such email was found' };
  }

  async getTemplateNames() {
    const names = await this.emailTemplateModel.find({}, { name: 1, _id: 1 });
    return names;
  }

  async getReceiptDataString(receiptTemplate, toWords, row) {
    receiptTemplate = receiptTemplate.replace(
      `{{{AMOUNT_IN_WORDS}}}`,
      toWords.convert(Number(row['AMOUNT_IN_NUM'])),
    );

    for (const key of Object.keys(row)) {
      receiptTemplate = receiptTemplate.replace(`{{{${key}}}}`, row[key]);
    }

    return receiptTemplate;
  }

  async clearCache() {
    var fs = require('fs');

    try {
      const files = await fs.readdirSync('./tmp');
      console.log(files);
      files.map(async (file, index) => {
        const res = fs.unlinkSync(`./tmp/${file}`);
      });
      console.log('all files of tmp folder deleted successfully');
      return files.length;
    } catch (e) {
      console.log(e);
      return -1;
    }
  }
  async generateReceipts(csvData: any[]) {
    var fs = require('fs');
    var html2pdf = require('html-pdf');
    const toWords = new ToWords({
      localeCode: 'en-IN',
      converterOptions: {
        ignoreDecimal: false,
      },
    });

    // FOR TESTING
    // const index = 0;
    // var receiptTemplate = fs.readFileSync("./receipts/generic2.html", "utf8");
    // // var html = await this.getReceiptDataString(receiptTemplate, row);
    // var options = { format: "A4" };

    // html2pdf.create(receiptTemplate, options).toFile(`./tmp/receipt_${index}.pdf`, function (err, res) {
    //   return `./tmp/receipts_${index}.pdf`;
    // });

    try {
      const stat = fs.statSync('./zip/archive.zip');
      const res = fs.unlinkSync('./zip/archive.zip');
      console.log('zip archive deleted successfully');
    } catch (e) {
      console.log('No zip file found');
    }

    // try {
    //   const files = await fs.readdirSync('./tmp');
    //   console.log(files);
    //   files.map(async (file, index) => {
    //     const res = fs.unlinkSync(`./tmp/${file}`);
    //   });
    //   console.log('all files of tmp folder deleted successfully');
    // } catch (e) {
    //   console.log("error while cleaning tmp directory");
    // }

    const paths = csvData.map(async (row, index) => {
      var receiptTemplate = fs.readFileSync('./receipts/generic2.html', 'utf8');
      var html = await this.getReceiptDataString(receiptTemplate, toWords, row);
      var options = { format: 'A4' };

      html2pdf
        .create(html, options)
        .toFile(`./tmp/receipt_${index}.pdf`, function (err, res) {
          return `./tmp/receipts_${index}.pdf`;
        });
    });

    return paths;
    // return { msg: "ok"}
  }

  async getEmailContent(obj, defaultTemplate) {
    const template = await this.emailTemplateModel.findById(defaultTemplate);
    if (template) {
      let body = template.body as String;
      for (const key of Object.keys(obj)) {
        body = body.replace(`{{{${key}}}}`, obj[key]);
      }
      return { subject: template.name, body: body };
    } else {
      return { subject: '', body: '' };
    }
  }

  async sendReceipts(csvData, defaultTemplate) {
    const errors = [];

    var fs = require('fs');

    // delete previous log file

    try {
      const files = await fs.readdirSync('./tmp');
      if (files.length !== csvData.length) {
        return -1;
      }
    } catch (e) {
      console.log('Unknown error occured', e);
    }

    try {
      const stat = fs.statSync('./tmp/0_log.txt');
      const res = fs.unlinkSync('./tmp/0_log.txt');
      console.log('log file deleted successfully');
    } catch (e) {
      console.log('No log file found');
    }

    try {
      const stat = fs.statSync('./tmp/0_error.txt');
      const res = fs.unlinkSync('./tmp/0_error.txt');
      console.log('error file deleted successfully');
    } catch (e) {
      console.log('No error file found');
    }

    const logStream = fs.createWriteStream(`./tmp/0_log.txt`, { flags: 'a' });
    const errorStream = fs.createWriteStream(`./tmp/0_error.txt`, {
      flags: 'a',
    });

    for (const [index, obj] of csvData.entries()) {
      const { subject, body } = await this.getEmailContent(
        obj,
        defaultTemplate,
      );
      const toSend = obj['EMAIL_TO_SEND'];

      const response = await this.sendMail(
        toSend,
        subject,
        body,
        `receipt_${index}.pdf`,
        `./tmp/receipt_${index}.pdf`,
      );
      if (response == -1) {
        errors.push(toSend);
        errorStream.write(
          `${new Date().toLocaleDateString()}: Failed to send email to ${toSend}\n`,
        );
      }

      logStream.write(`Successfully sent email to ${obj['NAME']}\n`);

      console.log('Successfully sent to ', obj['NAME']);
    }
    errorStream.end();
    logStream.end();
    return errors;
  }

  async sendMail(toSend, subject, body, fileName, attachmentPath) {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: CONFIG.GMAIL_ID,
        pass: CONFIG.GMAIL_PASSWORD,
      },
    });

    let mailOptions = {};
    if (CONFIG.CC_EMAIL) {
      mailOptions = {
        from: CONFIG.GMAIL_ID,
        to: toSend,
        cc: [CONFIG.CC_EMAIL],
        subject: subject,
        text: body,
        attachments: [
          {
            filename: fileName,
            path: attachmentPath,
            contentType: 'application/pdf',
          },
        ],
      };
    } else {
      mailOptions = {
        from: CONFIG.GMAIL_ID,
        to: toSend,
        subject: subject,
        text: body,
        attachments: [
          {
            filename: fileName,
            path: attachmentPath,
            contentType: 'application/pdf',
          },
        ],
      };
    }

    const res = await transporter.sendMail(mailOptions);

    if (res.err) {
      console.log(res.err);
      return -1;
    }

    return 0;
  }

  // async getZip() {
  //   const zip = new AdmZip();
  //   var fs = require('fs');
  //   const files = await fs.readdirSync('./tmp');
  //   console.log(files);
  //   for (const file of files) {
  //     await zip.addLocalFile(`./tmp/${file}`);
  //     console.log("added", file);
  //   }
  //   // const fileName = `${Date.now}_receipts.zip`;
  //   zip.writeZip('./tmp/archive.zip');

  //   try {
  //     const files = await fs.readdirSync('./tmp');
  //     console.log(files);
  //     files.map(async (file, index) => {
  //       const res = fs.unlinkSync(`./tmp/${file}`);
  //     });
  //     console.log('all files of tmp folder deleted successfully');
  //   } catch (e) {
  //     console.log("error while cleaning tmp directory");
  //   }

  //   return zip.toBuffer();
  // }

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
