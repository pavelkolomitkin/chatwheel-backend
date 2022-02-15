import {BaseController} from './base.controller';
import {BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put} from '@nestjs/common';
import {LoginPasswordCredentialsDto} from '../dto/login-password-credentials.dto';
import {LoginPasswordService} from '../services/login-password.service';
import {LoginPasswordRegisterDto} from '../dto/login-password-register.dto';
import {ClientUserDocument} from '../../core/schemas/client-user.schema';
import {UserConfirmRegisterDto} from '../dto/user-confirm-register.dto';
import {SecurityTokenService} from '../services/security-token.service';
import {RestorePasswordRequestDto} from "../dto/restore-password-request.dto";
import {RestorePasswordKeyValidator} from "../validators/restore-password-key.validator";
import {RestorePasswordDto} from "../dto/restore-password.dto";
import {ConfigService} from "@nestjs/config";

@Controller('login')
export class LoginPasswordController extends BaseController
{
    constructor(
        private readonly service: LoginPasswordService,
        private readonly tokenService: SecurityTokenService,
        private readonly restorePasswordKeyValidator: RestorePasswordKeyValidator,
        private readonly configService: ConfigService
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

    @Post('restore-password-request')
    @HttpCode(HttpStatus.OK)
    async restorePasswordRequest(@Body() data: RestorePasswordRequestDto)
    {
        await this.service.restorePasswordRequest(data);

        const secondsLeft = +this.configService.get('RESTORE_PASSWORD_REQUEST_INTERVAL');
        return {
            secondsLeft
        }
    }

    @Get('restore-password-key-check/:key')
    @HttpCode(HttpStatus.OK)
    async restorePasswordCheckKey(@Param('key') key: string)
    {
        const isValid: boolean = await this.restorePasswordKeyValidator.validate(key);
        if (!isValid)
        {
            throw new BadRequestException('The key is not valid', 'key');
        }
    }

    @Put('restore-password')
    @HttpCode(HttpStatus.OK)
    async restorePassword(@Body() data: RestorePasswordDto)
    {
        await this.service.restorePassword(data);
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