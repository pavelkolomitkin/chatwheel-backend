import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {useContainer, ValidationError} from 'class-validator';
import {BadRequestException, ValidationPipe} from "@nestjs/common";
import helmet from "helmet";


async function bootstrap() {

  const app = await NestFactory.create(AppModule, { cors: process.env.NODE_ENV !== 'production' });


  app.use(helmet());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
      new ValidationPipe({
          // disableErrorMessages: true,
        exceptionFactory: (validationErrors: ValidationError[] = []) => {
          return new BadRequestException(validationErrors)
        },
      }),
  )
    useContainer(app.select(AppModule), { fallbackOnErrors: true});


  await app.listen(process.env.PORT || 3000);
}
bootstrap();
