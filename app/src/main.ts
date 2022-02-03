import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {useContainer} from 'class-validator';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api');
  useContainer(app.select(AppModule), { fallbackOnErrors: true})

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
