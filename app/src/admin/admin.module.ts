import { Module } from '@nestjs/common';
import {ClientUserController} from "./controllers/client-user.controller";
import {ClientUserService} from "./services/client-user.service";
import {AbuseReportService} from "./services/abuse-report.service";
import {AbuseReportController} from "./controllers/abuse-report.controller";

@Module({
    controllers: [
        ClientUserController,
        AbuseReportController
    ],
    providers: [
        ClientUserService,
        AbuseReportService
    ]
})
export class AdminModule {}
