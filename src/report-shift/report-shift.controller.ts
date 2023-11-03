import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ReportShiftService } from './report-shift.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthGuard } from '@nestjs/passport';

@Controller('report-shift')
export class ReportShiftController {
  constructor(private readonly reportShiftService: ReportShiftService) {}
  @Get()
  async findAll() {
    return await this.reportShiftService.initializeMqttClientSpesifikMachine(2);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('report/:machineName')
  async findAllReport(@Req() req, @Param('machineName') machineName) {
    return this.reportShiftService.findAllReport( req.user['client'], machineName)
  }

  @Cron('0 */1 * * * *') // Menjalankan tugas setiap 1 menit
  async handleCron() {
    await this.reportShiftService.handleScehdule();
    // Tempatkan kode Anda di sini untuk menjalankan tugas yang dijadwalkan.
  }
}
