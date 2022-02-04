import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {useContainer, ValidationError} from 'class-validator';
import {BadRequestException, ValidationPipe} from "@nestjs/common";


async function bootstrap() {

  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
      new ValidationPipe({
        exceptionFactory: (validationErrors: ValidationError[] = []) => {
          return new BadRequestException(validationErrors)
        },
      }),
  )
    useContainer(app.select(AppModule), { fallbackOnErrors: true});


  await app.listen(process.env.PORT || 3000);
}
bootstrap();
