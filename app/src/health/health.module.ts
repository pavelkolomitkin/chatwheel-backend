import { Module } from '@nestjs/common';
import {CoreController} from './controllers/core.controller';

@Module({
  controllers: [CoreController]
})
export class HealthModule {}
