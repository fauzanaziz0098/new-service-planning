import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import { WrapResponseInterceptor } from './common/interceptors/wrap-response.interceptor';
import { DefaultExceptionsFilter } from './common/filters/default-exceptions.filter';
import { TypeORMExceptionFilter } from './common/filters/typeorm-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PgExceptionFilter } from './common/filters/pg-exception.filter';

const port = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const loggerTransports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        nestWinstonModuleUtilities.format.nestLike('MCV', {
          prettyPrint: true,
        }),
      ),
    }),
  ];

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const httpAdapter = app.get(HttpAdapterHost);
  const logger = WinstonModule.createLogger({ transports: loggerTransports });

  app.useGlobalFilters(
    new DefaultExceptionsFilter(httpAdapter, logger),
    new TypeORMExceptionFilter(httpAdapter, logger),
    new PgExceptionFilter(httpAdapter, logger),
    new HttpExceptionFilter(httpAdapter),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new WrapResponseInterceptor(),
  );
  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
    credentials: true,
  });

  console.log(port);

  await app.listen(Number(port));
}
bootstrap();
