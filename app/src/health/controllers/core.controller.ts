import {Controller, Get, HttpCode, HttpStatus} from '@nestjs/common';

@Controller('core')
export class CoreController {

    @Get('ping')
    @HttpCode(HttpStatus.OK)
    ping() {}
}
