import { Module } from '@nestjs/common';
import {ClientUserController} from "./controllers/client-user.controller";
import {ClientUserService} from "./services/client-user.service";
import {AbuseReportService} from "./services/abuse-report.service";
import {AbuseReportController} from "./controllers/abuse-report.controller";
import {AdminUserController} from "./controllers/admin-user.controller";
import {AdminUserService} from "./services/admin-user.service";
import {EditedEmailValidator} from "./validators/edited-email.validator";
import {AdminUserStateGateway} from "./gateways/admin-user-state.gateway";
import {CallService} from "./services/call.service";
import {CallController} from "./controllers/call.controller";
import {ClientUserStatisticsService} from "./services/statistics/client-user-statistics.service";
import {UserStatisticsController} from "./controllers/statistics/user-statistics.controller";
import {AbuseReportStatisticsController} from "./controllers/statistics/abuse-report-statistics.controller";
import {AbuseReportStatisticsService} from "./services/statistics/abuse-report-statistics.service";
import {CallStatisticsController} from "./controllers/statistics/call-statistics.controller";
import {CallStatisticsService} from "./services/statistics/call-statistics.service";

@Module({
    controllers: [
        ClientUserController,
        AbuseReportController,
        AdminUserController,
        CallController,
        UserStatisticsController,
        AbuseReportStatisticsController,
        CallStatisticsController
    ],
    providers: [
        ClientUserService,
        AbuseReportService,
        AdminUserService,
        CallService,
        ClientUserStatisticsService,
        AbuseReportStatisticsService,
        CallStatisticsService,

        EditedEmailValidator,

        AdminUserStateGateway
    ]
})
export class AdminModule {}
