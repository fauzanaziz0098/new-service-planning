import { Test, TestingModule } from '@nestjs/testing';
import { ProductionReportLineStopService } from './production-report-line-stop.service';

describe('ProductionReportLineStopService', () => {
  let service: ProductionReportLineStopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionReportLineStopService],
    }).compile();

    service = module.get<ProductionReportLineStopService>(ProductionReportLineStopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
