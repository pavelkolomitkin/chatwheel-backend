import {Controller, Get, UseGuards} from '@nestjs/common';
import {CurrentUser} from '../../core/decorators/user.decorator';
import {UserDocument} from '../../core/schemas/user.schema';
import {BaseController} from './base.controller';
import {AuthGuard} from "@nestjs/passport";
import {ValidateUserPipe} from "../../core/pipes/validate-user.pipe";

@UseGuards(AuthGuard())
@Controller('profile')
export class ProfileController extends BaseController
{
    @Get('/')
    async get(@CurrentUser(null, ValidateUserPipe) user: UserDocument)
    {
        return {
            // @ts-ignore
            user: user.serialize(['mine'])
        };
    }
}