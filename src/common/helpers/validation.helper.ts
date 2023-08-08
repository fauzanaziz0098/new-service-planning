import {
    BadRequestException,
    HttpStatus,
    ValidationError,
} from '@nestjs/common';

const extractErrorMessages = (error: ValidationError, prefix = ''): object => {
    const messages = {};
    if (error.children?.length) {
        error.children.forEach((subError) => {
            const newMessages = extractErrorMessages(
                subError,
                `${prefix}${error.property}.`,
            );
            Object.assign(messages, newMessages);
        });
    }
    const constraints = Object.values(error.constraints || {});
    if (constraints.length) {
        let key = error.property;
        if (prefix) {
            const regex = new RegExp(`${error.property}\\.\\d*\\.$`);
            key = regex.test(prefix)
                ? prefix.substring(0, prefix.length - 1)
                : `${prefix}${error.property}`;
        }
        messages[key] = constraints;
    }
    return messages;
};

export const validationExceptionFactory = (errors: ValidationError[]) => {
    const messages = {};
    errors.forEach((error) => {
        const newMessages = extractErrorMessages(error);
        Object.assign(messages, newMessages);
    });
    return new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        messages,
        error: 'Bad Request',
    });
};
