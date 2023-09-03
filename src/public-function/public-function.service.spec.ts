import { Test, TestingModule } from '@nestjs/testing';
import { PublicFunctionService } from './public-function.service';

describe('PublicFunctionService', () => {
  let service: PublicFunctionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicFunctionService],
    }).compile();

    service = module.get<PublicFunctionService>(PublicFunctionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
