import {Controller, Get, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {CurrentUser} from '../../core/decorators/user.decorator';
import {AdminUserDocument} from '../../core/schemas/admin-user.schema';
import {RoleBasedGuard} from '../../core/guards/role-based.guard';
import {Roles} from '../../core/decorators/role.decorator';
import {ROLE_ADMIN_USER} from '../../core/schemas/user.schema';

@Controller('client-user')
@Roles(ROLE_ADMIN_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class ClientUserController
{

    @Get('list')
    async list(
        @CurrentUser() user: AdminUserDocument
    )
    {
        return [];
    }
}