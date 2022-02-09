import {Controller, Get, UseGuards, UseInterceptors} from '@nestjs/common';
import {CurrentUser} from '../../core/decorators/user.decorator';
import {User} from '../../core/schemas/user.schema';
import {BaseController} from './base.controller';
import {AuthGuard} from "@nestjs/passport";

@UseGuards(AuthGuard())
@Controller('profile')
export class ProfileController extends BaseController
{
    @Get('/')
    get(@CurrentUser() user: User)
    {
        // @ts-ignore
        const data = user.serialize(['mine']);

        return {
            user: data
        };
    }
}