import { Module } from '@nestjs/common';
import {ClientUserController} from "./controllers/client-user.controller";
import {ClientUserService} from "./services/client-user.service";
import {AbuseReportService} from "./services/abuse-report.service";
import {AbuseReportController} from "./controllers/abuse-report.controller";
import {AdminUserController} from "./controllers/admin-user.controller";
import {AdminUserService} from "./services/admin-user.service";
import {EditedEmailValidator} from "./validators/edited-email.validator";
import {AdminUserStateGateway} from "./gateways/admin-user-state.gateway";

@Module({
    controllers: [
        ClientUserController,
        AbuseReportController,
        AdminUserController
    ],
    providers: [
        ClientUserService,
        AbuseReportService,
        AdminUserService,

        EditedEmailValidator,

        AdminUserStateGateway
    ]
})
export class AdminModule {}
