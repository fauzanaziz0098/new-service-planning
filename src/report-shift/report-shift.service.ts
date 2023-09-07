import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ReportShiftService {
  constructor() {} // @InjectRepository(Report)
}
