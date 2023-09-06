import { Test, TestingModule } from '@nestjs/testing';
import { ProductionReportLineStopController } from './production-report-line-stop.controller';

describe('ProductionReportLineStopController', () => {
  let controller: ProductionReportLineStopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionReportLineStopController],
    }).compile();

    controller = module.get<ProductionReportLineStopController>(ProductionReportLineStopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
