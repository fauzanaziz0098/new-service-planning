import { Test, TestingModule } from '@nestjs/testing';
import { ReportShiftController } from './report-shift.controller';

describe('ReportShiftController', () => {
  let controller: ReportShiftController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportShiftController],
    }).compile();

    controller = module.get<ReportShiftController>(ReportShiftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
