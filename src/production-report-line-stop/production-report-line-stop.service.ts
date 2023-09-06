import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductionReportLineStopDto } from './dto/create-production-report-line-stop.dto';
import { ProductionReportLineStop } from './entities/production-report-line-stop.entity';

@Injectable()
export class ProductionReportLineStopService {
  constructor(
    @InjectRepository(ProductionReportLineStop)
    private readonly productionReportLineStopRepository: Repository<ProductionReportLineStop>,
  ) {}

  async create(
    createProductionReportLineStopDto: CreateProductionReportLineStopDto,
  ) {
    return await this.productionReportLineStopRepository.save(
      createProductionReportLineStopDto,
    );
  }
}
