import { Module } from '@nestjs/common';
import { ReportOeeController } from './report-oee.controller';
import { ReportOeeService } from './report-oee.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportOee } from './entities/report-oee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportOee])],
  controllers: [ReportOeeController],
  providers: [ReportOeeService],
  exports: [ReportOeeService],
})
export class ReportOeeModule {}
