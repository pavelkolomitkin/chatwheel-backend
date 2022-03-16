import {Body, Controller, Delete, Get, ParseIntPipe, Post, Put, Query, UseGuards} from "@nestjs/common";
import {Roles} from "../../core/decorators/role.decorator";
import {ROLE_ADMIN_USER} from "../../core/schemas/user.schema";
import {AuthGuard} from "@nestjs/passport";
import {RoleBasedGuard} from "../../core/guards/role-based.guard";
import {CurrentUser} from "../../core/decorators/user.decorator";
import {AdminUser, AdminUserDocument} from "../../core/schemas/admin-user.schema";
import {AdminUserService} from "../services/admin-user.service";
import {CreateAdminUserDto} from "../dto/create-admin-user.dto";
import {ResetAdminPasswordDto} from "../dto/reset-admin-password.dto";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";
import {EditAdminUserDto} from "../dto/edit-admin-user.dto";

@Controller('admin-user')
@Roles(ROLE_ADMIN_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class AdminUserController
{
    constructor(
        private readonly service: AdminUserService
    ) {
    }

    @Get('number')
    async getNumber()
    {
        const result: number = await this.service.getNumber();

        return {
            number: result
        };
    }

    @Get('list')
    async list(
        @CurrentUser() user: AdminUserDocument,
        @Query('page', ParseIntPipe) page: number = 1
    )
    {
        const result: AdminUserDocument[] = await this.service.getList(page);
        const totalNumber: number = await this.service.getNumber();

        return {
            // @ts-ignore
            list: result.map(item => item.serialize(['admin'])),
            totalNumber
        };

    }

    @Post()
    async create(
        @CurrentUser() user: AdminUserDocument,
        @Body() data: CreateAdminUserDto
    )
    {
        const result: AdminUserDocument = await this.service.create(user, data);

        return {
            // @ts-ignore
            admin: result.serialize()
        };
    }

    @Put('edit/:adminId')
    async edit(
        @CurrentUser() superAdmin: AdminUserDocument,
        @ParameterConverter({
            model: AdminUser.name,
            field: 'id',
            paramName: 'adminId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) admin: AdminUserDocument,
        @Body() data: EditAdminUserDto
    )
    {
        const result: AdminUserDocument = await this.service.edit(superAdmin, admin, data);

        return {
            // @ts-ignore
            admin: result.serialize()
        };
    }

    @Put('reset-password/:adminId')
    async resetPassword(
        @CurrentUser() superAdmin: AdminUserDocument,
        @ParameterConverter({
            model: AdminUser.name,
            field: 'id',
            paramName: 'adminId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) admin: AdminUserDocument,
        @Body() data: ResetAdminPasswordDto,
    )
    {
        const result: AdminUserDocument = await this.service.resetPassword(superAdmin, admin, data);

        return {
            // @ts-ignore
            admin: result.serialize()
        };
    }

    @Delete(':adminId')
    async delete(
        @CurrentUser() superAdmin: AdminUserDocument,
        @ParameterConverter({
            model: AdminUser.name,
            field: 'id',
            paramName: 'adminId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) admin: AdminUserDocument,
    )
    {
        const result: AdminUserDocument = await this.service.delete(superAdmin, admin);

        return {
            // @ts-ignore
            admin: result.serialize()
        };
    }
}