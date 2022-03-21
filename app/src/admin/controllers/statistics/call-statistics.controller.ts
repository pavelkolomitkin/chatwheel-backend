import {Controller, Get, Query, UseGuards} from '@nestjs/common';
import {Roles} from '../../../core/decorators/role.decorator';
import {ROLE_ADMIN_USER} from '../../../core/schemas/user.schema';
import {AuthGuard} from '@nestjs/passport';
import {RoleBasedGuard} from '../../../core/guards/role-based.guard';
import {CallStatisticsService} from '../../services/statistics/call-statistics.service';
import {MonthPeriodDto} from "../../dto/month-period.dto";

@Controller('call-statistics')
@Roles(ROLE_ADMIN_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class CallStatisticsController
{
    constructor(
        private readonly service: CallStatisticsService
    ) {}

    @Get('numbers')
    async getNumbers()
    {
        const total: number = await this.service.getNumber();
        const chatWheelNumber: number = await this.service.getNumber(false);
        const directCallNumber: number = await this.service.getNumber(true);

        return {
            total,
            chatWheelNumber,
            directCallNumber
        };
    }

    @Get('months')
    async getMonthStatistics(
        @Query() period: MonthPeriodDto,
        @Query('startMonth') startMonth: Date,
        @Query('endMonth') endMonth: Date
    )
    {
        const allStatistics = await this.service.getMonthStatistics(startMonth, endMonth);
        const chatWheelStatistics = await this.service.getMonthStatistics(startMonth, endMonth, false);
        const directCallStatistics = await this.service.getMonthStatistics(startMonth, endMonth, true);

        return {
            all: allStatistics,
            chatWheel: chatWheelStatistics,
            directCalls: directCallStatistics
        };
    }
}