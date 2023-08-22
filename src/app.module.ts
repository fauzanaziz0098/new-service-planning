import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';
import { ProductModule } from './product/product.module';
import { MachineModule } from './machine/machine.module';
import { ShiftModule } from './shift/shift.module';
import { NoPlanMachineModule } from './no-plan-machine/no-plan-machine.module';
import { PlanningProductionModule } from './planning-production/planning-production.module';
import { PlanningProductionReportModule } from './planning-production-report/planning-production-report.module';

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
    RoleModule,
    UserModule,
    ClientModule,
    ProductModule,
    MachineModule,
    ShiftModule,
    NoPlanMachineModule,
    PlanningProductionModule,
    PlanningProductionReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
