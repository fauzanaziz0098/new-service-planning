import { Module, forwardRef } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceController } from './presence.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presence } from './entities/presence.entity';
import { PlanningProductionModule } from 'src/planning-production/planning-production.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Presence]),
    forwardRef(() => PlanningProductionModule),
  ],
  controllers: [PresenceController],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
