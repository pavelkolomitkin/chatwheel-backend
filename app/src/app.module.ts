import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { SecurityModule } from './security/security.module';
import {RouterModule} from "@nestjs/core";
import { ClientModule } from './client/client.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    CoreModule,
    SecurityModule,
    ClientModule,
    AdminModule,

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
      }
    ]),

    AdminModule,
  ],
})
export class AppModule {}
