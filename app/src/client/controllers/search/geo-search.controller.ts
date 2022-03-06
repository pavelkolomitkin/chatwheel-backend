import {Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards} from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";
import {MapSearchDto} from "../../dto/search/map-search.dto";
import {CurrentUser} from "../../../core/decorators/user.decorator";
import {ClientUserDocument} from "../../../core/schemas/client-user.schema";
import {SearchService} from "../../services/search/search.service";
import {ProfileService} from "../../services/profile.service";

@Controller('search/geo')
@UseGuards(AuthGuard('jwt'))
export class GeoSearchController
{
    constructor(
        private readonly service: SearchService,
        private readonly profileService: ProfileService
    ) {
    }

    @Post('box')
    @HttpCode(HttpStatus.OK)
    async getWithInBox(
        @Body() params: MapSearchDto
    )
    {
        const users: ClientUserDocument[] = await this.service.getWithInBox(params);

        return {
            // @ts-ignore
            users: users.map(user => user.serialize())
        };
    }

    @Get('near-by')
    @HttpCode(HttpStatus.OK)
    async getNearBy(
        @CurrentUser() user: ClientUserDocument,
        @Query('page') page: number = 1
    )
    {
        const users = await this.service.getNearBy(user, page);
        const banStatuses = await this.profileService.getBanStatuses(user, users);

        return {
            // @ts-ignore
            users: users.map(user => user.serialize()),
            banStatuses
        };
    }
}