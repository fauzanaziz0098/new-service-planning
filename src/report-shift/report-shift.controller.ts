import { Controller, Get } from '@nestjs/common';
import { ReportShiftService } from './report-shift.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('report-shift')
export class ReportShiftController {
  constructor(private readonly reportShiftService: ReportShiftService) {}
  @Get()
  async findAll() {
    return await this.reportShiftService.initializeMqttClientSpesifikMachine(2);
  }

  @Cron('0 */1 * * * *') // Menjalankan tugas setiap 1 menit
  async handleCron() {
    await this.reportShiftService.handleScehdule();
    // Tempatkan kode Anda di sini untuk menjalankan tugas yang dijadwalkan.
  }
}
