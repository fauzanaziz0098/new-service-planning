import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    LoggerService,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class DefaultExceptionsFilter implements ExceptionFilter {
    constructor(
        protected readonly httpAdapterHost: HttpAdapterHost,
        protected readonly logger: LoggerService,
    ) {}

    catch(exception: any, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        const responseBody = {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal Server Error',
        };

        const exceptionLog = {
            timestamp: new Date().toISOString(),
            message: exception.message || 'Unknown error',
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            stack: exception.stack,
            exception,
        };
        this.logger.error(exceptionLog);

        httpAdapter.reply(
            ctx.getResponse(),
            responseBody,
            responseBody.statusCode,
        );
    }
}
