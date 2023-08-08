import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { DefaultExceptionsFilter } from './default-exceptions.filter';

@Catch(QueryFailedError)
export class PgExceptionFilter extends DefaultExceptionsFilter {
    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        const knownErrors = [
            '23503', // non existent key violates foreign key constraint
            '23505', // duplicate key value violates unique constraint
        ];
        if (knownErrors.includes(exception.driverError.code)) {
            // duplicate key value violates unique constraint
            const responseBody = {
                statusCode: HttpStatus.BAD_REQUEST,
                message: [exception.driverError.detail],
                error: 'Bad Request',
            };
            return httpAdapter.reply(
                ctx.getResponse(),
                responseBody,
                responseBody.statusCode,
            );
        }

        return super.catch(exception, host);
    }
}
