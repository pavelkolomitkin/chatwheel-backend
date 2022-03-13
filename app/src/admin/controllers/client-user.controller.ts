import {Controller, Get, ParseIntPipe, Query, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {CurrentUser} from '../../core/decorators/user.decorator';
import {AdminUserDocument} from '../../core/schemas/admin-user.schema';
import {RoleBasedGuard} from '../../core/guards/role-based.guard';
import {Roles} from '../../core/decorators/role.decorator';
import {ROLE_ADMIN_USER} from '../../core/schemas/user.schema';
import {ClientUserService} from "../services/client-user.service";
import {ClientUserFilterDto} from "../dto/client-user-filter.dto";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";

@Controller('client-user')
@Roles(ROLE_ADMIN_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class ClientUserController
{
    constructor(
        private readonly service: ClientUserService
    ) {
    }

    @Get('list')
    async list(
        @CurrentUser() user: AdminUserDocument,
        @Query() filter: ClientUserFilterDto,
        @Query('page', ParseIntPipe) page: number = 1
    )
    {
        const users: ClientUserDocument[] = await this.service.getList(filter, page);

        return {
            // @ts-ignore
            users: users.map(user => user.serialize(['admin']))
        }

    }

    @Get('number')
    async getNumber(
        @CurrentUser() user: AdminUserDocument,
        @Query('type') type: number = null
    )
    {
        const number: number = await this.service.getNumber(type);

        return {
            number: number
        };
    }
}