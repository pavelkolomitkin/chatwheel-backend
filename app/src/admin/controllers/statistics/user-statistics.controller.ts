import {Controller, Get, Query, UseGuards} from "@nestjs/common";
import {CurrentUser} from "../../../core/decorators/user.decorator";
import {AdminUserDocument} from "../../../core/schemas/admin-user.schema";
import {Roles} from "../../../core/decorators/role.decorator";
import {ROLE_ADMIN_USER} from "../../../core/schemas/user.schema";
import {AuthGuard} from "@nestjs/passport";
import {RoleBasedGuard} from "../../../core/guards/role-based.guard";
import {ClientUserStatisticsService} from "../../services/statistics/client-user-statistics.service";
import {AuthUserTypes} from "../../../core/models/data/auth-user-type.enum";
import {MonthPeriodDto} from "../../dto/month-period.dto";

@Controller('client-user-statistics')
@Roles(ROLE_ADMIN_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class UserStatisticsController
{
    constructor(
        private readonly service: ClientUserStatisticsService
    ) {
    }

    @Get('number')
    async getNumber(
        @CurrentUser() user: AdminUserDocument
    )
    {
        const total: number = await this.service.getNumber();
        const emailNumber: number = await this.service.getNumber(AuthUserTypes.EMAIL);
        const vkNumber: number = await this.service.getNumber(AuthUserTypes.VK);


        return {
            total,
            emailNumber,
            vkNumber
        };
    }

    @Get('months')
    async getMonthsStatistics(
        @Query() period: MonthPeriodDto,
        @Query('startMonth') startMonth: Date,
        @Query('endMonth') endMonth: Date
    )
    {
        const allUsers = await this.service.getMonthsStatistics(startMonth, endMonth);
        const emailUsers = await this.service.getMonthsStatistics(startMonth, endMonth, AuthUserTypes.EMAIL);
        const vkUsers = await this.service.getMonthsStatistics(startMonth, endMonth, AuthUserTypes.VK);

        return {
            statistics: {
                all: allUsers,
                email: emailUsers,
                vk: vkUsers
            }
        }
    }
}