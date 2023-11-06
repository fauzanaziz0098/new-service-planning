import { Module } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceController } from './presence.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presence } from './entities/presence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Presence])],
  controllers: [PresenceController],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
