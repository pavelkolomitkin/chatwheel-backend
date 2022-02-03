import {BaseController} from "./base.controller";
import {Body, Controller, HttpCode, HttpStatus, Post} from "@nestjs/common";
import {LoginPasswordCredentialsDto} from "../dto/login-password-credentials.dto";
import {LoginPasswordService} from "../services/login-password.service";
import {LoginPasswordRegisterDto} from "../dto/login-password-register.dto";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";

@Controller('login')
export class LoginPasswordController extends BaseController
{
    constructor(
        private readonly service: LoginPasswordService
    ) {
        super();
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() credentials: LoginPasswordCredentialsDto)
    {
        // login a user with the credentials

        return {
            token: 'this is the secret key!'
        };
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() data: LoginPasswordRegisterDto)
    {
        const user: ClientUserDocument = await this.service.register(data);

        return {};
    }
}