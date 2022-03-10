import {Body, Controller, HttpCode, HttpStatus, Post} from "@nestjs/common";
import {VkAuthDto} from "../dto/vk-auth.dto";
import {VkAuthService} from "../services/vk-auth.service";

@Controller('vk')
export class VkAuthController
{
    constructor(
        private readonly vkAuthService: VkAuthService
    ) {
    }

    @Post('/auth')
    @HttpCode(HttpStatus.OK)
    async auth(@Body() data: VkAuthDto)
    {
        const token: string = await this.vkAuthService.auth(data);

        return {
            token
        };
    }
}