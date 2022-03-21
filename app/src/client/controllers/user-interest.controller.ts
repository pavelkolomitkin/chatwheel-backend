import {Controller, Get, Query, UseGuards} from "@nestjs/common";
import {UserInterestService} from "../services/user-interest.service";
import {UserInterestDocument} from "../../core/schemas/user-interest.schema";
import {AuthGuard} from "@nestjs/passport";
import {Roles} from "../../core/decorators/role.decorator";
import {ROLE_CLIENT_USER} from "../../core/schemas/user.schema";
import {RoleBasedGuard} from "../../core/guards/role-based.guard";

@Controller('interest')
@Roles(ROLE_CLIENT_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
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