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
  
}
