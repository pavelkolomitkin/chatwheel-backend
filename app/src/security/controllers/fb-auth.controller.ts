import {Body, Controller, HttpCode, HttpStatus, Post} from "@nestjs/common";
import {FbAuthDto} from "../dto/fb-auth.dto";
import {FbAuthService} from "../services/social-net-auth/fb-auth.service";

@Controller('fb')
export class FbAuthController
{
    constructor(
        private readonly service: FbAuthService
    ) {
    }

    @Post('auth')
    @HttpCode(HttpStatus.OK)
    async auth(@Body() data: FbAuthDto)
    {
        const token: string = await this.service.auth(data);

        return {
            token
        };
    }
}