import { Module } from '@nestjs/common';
import { PublicFunctionService } from './public-function.service';

@Module({
  providers: [PublicFunctionService],
  exports: [PublicFunctionService],
})
export class PublicFunctionModule {}
