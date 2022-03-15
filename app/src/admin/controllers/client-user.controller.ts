import {Body, Controller, Delete, Get, ParseIntPipe, Put, Query, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {CurrentUser} from '../../core/decorators/user.decorator';
import {AdminUserDocument} from '../../core/schemas/admin-user.schema';
import {RoleBasedGuard} from '../../core/guards/role-based.guard';
import {Roles} from '../../core/decorators/role.decorator';
import {ROLE_ADMIN_USER} from '../../core/schemas/user.schema';
import {ClientUserService} from "../services/client-user.service";
import {ClientUserFilterDto} from "../dto/client-user-filter.dto";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";
import {ValidateUserPipe} from "../../core/pipes/validate-user.pipe";

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
        const totalNumber: number = await this.service.getListTotalUserNumber(filter);

        return {
            // @ts-ignore
            users: users.map(user => user.serialize(['admin'])),
            totalNumber
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

    @Put('block')
    async block(
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'user',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) user: ClientUserDocument,
        @Body('reason') reason: string = null
    )
    {
        const blockedUser: ClientUserDocument = await this.service.block(user, reason);

        return {
            // @ts-ignore
            user: blockedUser.serialize(['admin'])
        };
    }

    @Put('unblock')
    async unBlock(
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'user',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) user: ClientUserDocument,
    )
    {
        const unblockedUser: ClientUserDocument = await this.service.unBlock(user);

        return {
            // @ts-ignore
            user: unblockedUser.serialize(['admin'])
        };
    }

    @Delete('delete/:id')
    async delete(
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) user: ClientUserDocument,
    )
    {
        const deletedUser: ClientUserDocument = await this.service.delete(user);

        return {
            // @ts-ignore
            user: deletedUser.serialize(['admin'])
        };
    }
}