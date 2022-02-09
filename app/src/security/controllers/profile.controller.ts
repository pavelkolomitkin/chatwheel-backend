import {Controller, Get, UseGuards, UseInterceptors} from '@nestjs/common';
import {CurrentUser} from '../../core/decorators/user.decorator';
import {ROLE_CLIENT_USER, User, UserDocument} from '../../core/schemas/user.schema';
import {BaseController} from './base.controller';
import {AuthGuard} from "@nestjs/passport";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";

@UseGuards(AuthGuard())
@Controller('profile')
export class ProfileController extends BaseController
{
    @Get('/')
    async get(@CurrentUser() user: UserDocument)
    {
        // @ts-ignore
        const data = user.serialize(['mine']);

        return {
            user: data
        };
    }
}