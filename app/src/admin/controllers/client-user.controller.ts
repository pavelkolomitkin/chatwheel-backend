import {Body, Controller, Delete, Get, HttpCode, HttpStatus, ParseIntPipe, Put, Query, UseGuards} from '@nestjs/common';
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
import {BlockUserDto} from "../dto/block-user.dto";

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
    @HttpCode(HttpStatus.OK)
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

    @Get('/user/:id')
    @HttpCode(HttpStatus.OK)
    async get(
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) user: ClientUserDocument
    )
    {
        await user.populate(ClientUser.COMMON_POPULATED_FIELDS.join(' '));

        return {
            // @ts-ignore
            user: user.serialize(['admin'])
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
        //@Body('reason') reason: string = null
        @Body() data: BlockUserDto
    )
    {
        const blockedUser: ClientUserDocument = await this.service.block(user, data);

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