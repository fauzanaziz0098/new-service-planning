import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { MachineModule } from './machine/machine.module';
import { ShiftModule } from './shift/shift.module';
import { NoPlanMachineModule } from './no-plan-machine/no-plan-machine.module';
import { PlanningProductionModule } from './planning-production/planning-production.module';
import { PlanningProductionReportModule } from './planning-production-report/planning-production-report.module';
import { NoPlanMachineAdditionalModule } from './no-plan-machine-additional/no-plan-machine-additional.module';
import { PublicFunctionModule } from './public-function/public-function.module';
import { ProductionReportLineStopModule } from './production-report-line-stop/production-report-line-stop.module';
import { ReportShiftModule } from './report-shift/report-shift.module';
import { ConditionMachineModule } from './condition-machine/condition-machine.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        // url: configService.get('DATABASE_URL'),
        host: configService.get<string>('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        // ssl: {
        //   rejectUnauthorized: true,
        //   ca: fs.readFileSync('ca_cert.crt').toString(),
        // },
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..'),
    }),

    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/.env.${process.env.NODE_ENV}`,
    }),

    AuthModule,
    ProductModule,
    MachineModule,
    ShiftModule,
    NoPlanMachineModule,
    PlanningProductionModule,
    PlanningProductionReportModule,
    NoPlanMachineAdditionalModule,
    PublicFunctionModule,
    ProductionReportLineStopModule,
    ReportShiftModule,
    ConditionMachineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
