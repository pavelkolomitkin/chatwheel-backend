import {Controller, Get, ParseIntPipe, Query, UseGuards} from '@nestjs/common';
import {Roles} from '../../core/decorators/role.decorator';
import {ROLE_ADMIN_USER} from '../../core/schemas/user.schema';
import {AuthGuard} from '@nestjs/passport';
import {RoleBasedGuard} from '../../core/guards/role-based.guard';
import {CallListFilterDto} from '../dto/call-list-filter.dto';
import {CallService} from '../services/call.service';
import {Call} from '../../core/schemas/call.schema';

@Controller('call')
@Roles(ROLE_ADMIN_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class CallController
{
    constructor(
        private readonly service: CallService
    ) {
    }

    @Get('list')
    async getList(
        @Query() data: CallListFilterDto,
        @Query('page', ParseIntPipe) page: number = 1
    )
    {
        const calls: Call[] = await this.service.getList(data, page);
        const foundNumber: number = await this.service.getNumber(data);

        const list: any = calls.map(call => {

            // @ts-ignore
            const result: any = call.serialize(['admin']);

            result.members = call.members.map(member => {

                return {
                    // @ts-ignore
                    ...member.serialize(['admin']),
                    // @ts-ignore
                    user: member.user.serialize(['admin'])
                };

            });

            return result;
        });

        return {
            // @ts-ignore
            list,
            number: foundNumber
        };

    }
}