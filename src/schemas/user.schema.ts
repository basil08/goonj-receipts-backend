import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class User {
  @Prop({ required: true })
  username: string;
  @Prop({ required: true, unique: true })
  email: string;
  @Prop({ required: true })
  password_hash: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
