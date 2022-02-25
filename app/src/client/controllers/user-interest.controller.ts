import {Controller, Get, Query, UseGuards} from "@nestjs/common";
import {UserInterestService} from "../services/user-interest.service";
import {UserInterestDocument} from "../../core/schemas/user-interest.schema";
import {AuthGuard} from "@nestjs/passport";

@Controller('interest')
@UseGuards(AuthGuard('jwt'))
export class UserInterestController
{
    constructor(
        private readonly service: UserInterestService
    ) {
    }

    @Get('/search')
    async search(
        @Query('name') name: string,
        @Query('page') page: number = 1
    )
    {
        const list:UserInterestDocument[] = await this.service.getList({ name }, page);

        return {
            // @ts-ignore
            list: list.map(item => item.serialize())
        };
    }
}