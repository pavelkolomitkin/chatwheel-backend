import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { SecurityModule } from './security/security.module';
import {RouterModule} from "@nestjs/core";
import { ClientModule } from './client/client.module';

@Module({
  imports: [
    CoreModule,
    SecurityModule,
    ClientModule,

    RouterModule.register([
      {
        path: 'security',
        module: SecurityModule
      },
      {
        path: 'core',
        module: CoreModule
      },
      {
        path: 'client',
        module: ClientModule
      }
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
