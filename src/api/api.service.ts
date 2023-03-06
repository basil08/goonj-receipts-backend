import { Injectable } from '@nestjs/common';
import {
  EmailTemplate,
  EmailTemplateDocument,
} from 'src/schemas/emailtemplate.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
      createdBy: 
      createdAt: new Date()
    });

    return emailTemplate.save()
  }

}
