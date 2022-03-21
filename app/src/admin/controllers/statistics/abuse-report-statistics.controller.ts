import {Controller, Get, Query, UseGuards} from "@nestjs/common";
import {Roles} from "../../../core/decorators/role.decorator";
import {ROLE_ADMIN_USER} from "../../../core/schemas/user.schema";
import {AuthGuard} from "@nestjs/passport";
import {RoleBasedGuard} from "../../../core/guards/role-based.guard";
import {AbuseReportStatisticsService} from "../../services/statistics/abuse-report-statistics.service";
import {MonthPeriodDto} from "../../dto/month-period.dto";

@Controller('abuse-report-statistics')
@Roles(ROLE_ADMIN_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class AbuseReportStatisticsController
{
    constructor(
        private readonly service: AbuseReportStatisticsService
    ) {
    }

    @Get('numbers')
    async getNumbers()
    {
        const totalNumber: number = await this.service.getTotalNumber(false);
        const newNumber: number = await this.service.getTotalNumber(true);

        return {
            totalNumber: totalNumber,
            newNumber: newNumber,
        };
    }

    @Get('type-numbers')
    async getTypeNumbers()
    {
        const statistics = await this.service.getTypeNumbers();

        return {
            statistics: statistics
        }
    }

    @Get('months')
    async getMonthStatistics(
        @Query() period: MonthPeriodDto,
        @Query('startMonth') startMonth: Date,
        @Query('endMonth') endMonth: Date
    )
    {
        const statistics = await this.service.getMonthStatistics(startMonth, endMonth);

        return {
            statistics: statistics
        };
    }
}