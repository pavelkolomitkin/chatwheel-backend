import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { SecurityModule } from './security/security.module';
import {RouterModule} from "@nestjs/core";
import { ClientModule } from './client/client.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    CoreModule,
    SecurityModule,
    ClientModule,
    AdminModule,
    HealthModule,

    RouterModule.register([
      {
        path: 'security',
        module: SecurityModule,
      },
      {
        path: 'core',
        module: CoreModule
      },
      {
        path: 'client',
        module: ClientModule
      },
      {
        path: 'admin',
        module: AdminModule
      },
      {
        path: 'health',
        module: HealthModule
      }
    ]),
  ],
})
export class AppModule {}
