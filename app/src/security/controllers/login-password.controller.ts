import {BaseController} from './base.controller';
import {Body, Controller, HttpCode, HttpStatus, Post, Put} from '@nestjs/common';
import {LoginPasswordCredentialsDto} from '../dto/login-password-credentials.dto';
import {LoginPasswordService} from '../services/login-password.service';
import {LoginPasswordRegisterDto} from '../dto/login-password-register.dto';
import {ClientUserDocument} from '../../core/schemas/client-user.schema';
import {UserConfirmRegisterDto} from '../dto/user-confirm-register.dto';
import {SecurityTokenService} from '../services/security-token.service';

@Controller('login')
export class LoginPasswordController extends BaseController
{
    constructor(
        private readonly service: LoginPasswordService,
        private readonly tokenService: SecurityTokenService
    ) {
        super();
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() credentials: LoginPasswordCredentialsDto)
    {
        // login a user with the credentials
        const token: string = await this.service.login(credentials);

        return {
            token
        };
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() data: LoginPasswordRegisterDto)
    {
        const user: ClientUserDocument = await this.service.register(data);

        return {};
    }

    @Put('register-confirm')
    @HttpCode(HttpStatus.OK)
    async registerConfirm(@Body() data: UserConfirmRegisterDto) {

        // confirm the user account
        const user: ClientUserDocument = await this.service.confirmRegisteredAccount(data);

        // create a user token to be returned
        const token: string = this.tokenService.getUserToken(user);

        return { token };
    }
}