import { Controller, Get } from '@nestjs/common';
import { ReportShiftService } from './report-shift.service';

@Controller('report-shift')
export class ReportShiftController {
  constructor(private readonly reportShiftService: ReportShiftService) {}
  @Get()
  async findAll() {
    return await this.reportShiftService.initializeMqttClientSpesifikMachine(2);
  }
}
