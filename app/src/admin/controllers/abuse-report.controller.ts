import {Controller, Get, UseGuards} from "@nestjs/common";
import {Roles} from "../../core/decorators/role.decorator";
import {ROLE_ADMIN_USER} from "../../core/schemas/user.schema";
import {AuthGuard} from "@nestjs/passport";
import {RoleBasedGuard} from "../../core/guards/role-based.guard";
import {AbuseReportService} from "../services/abuse-report.service";

@Controller('abuse-report')
@Roles(ROLE_ADMIN_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class AbuseReportController
{
    constructor(
        private readonly service: AbuseReportService
    ) {
    }

    @Get('new-number')
    async getNewNumber()
    {
        const number: number = await this.service.getNewNumber();

        return {
            number
        };
    }
}