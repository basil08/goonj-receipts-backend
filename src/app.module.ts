import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ApiModule } from './api/api.module';
import CONFIG from './utils/config';

@Module({
  imports: [MongooseModule.forRoot(CONFIG.MONGODB_STRING), AuthModule, ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
