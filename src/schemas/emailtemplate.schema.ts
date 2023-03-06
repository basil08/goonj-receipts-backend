import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';

@Schema()
export class EmailTemplate {
  @Prop({ required: false, default: 'My Email Template' })
  name: string;

  @Prop({ required: true })
  body: string;

  @Prop({ required: true })
  createdBy: User;

  @Prop({ required: true })
  createdAt: Date;
}

export type EmailTemplateDocument = EmailTemplate & Document;
export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);
