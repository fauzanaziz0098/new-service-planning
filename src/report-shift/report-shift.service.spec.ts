import { Test, TestingModule } from '@nestjs/testing';
import { ReportShiftService } from './report-shift.service';

describe('ReportShiftService', () => {
  let service: ReportShiftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportShiftService],
    }).compile();

    service = module.get<ReportShiftService>(ReportShiftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
