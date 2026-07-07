/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  PipeTransform,
  Injectable,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseMongoIdPipe implements PipeTransform {
  transform(value: any) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException({
        message: ['Invalid ObjectId'],
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
      });
    }
    return value;
  }
}

/**
 * @description
 * This pipe is used to validate and parse route parameters that are expected to be integers.
 * It checks if the provided value is a valid integer and greater than zero.
 * If the value is invalid, it throws a BadRequestException with a specific error message.
 */
export class ParseParamIdPipe implements PipeTransform {
  transform(value: any) {
    const id = parseInt(value, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException({
        message: ['Invalid route params'],
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
      });
    }
    return id;
  }
}
