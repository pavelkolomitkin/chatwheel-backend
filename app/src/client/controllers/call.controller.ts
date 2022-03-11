import {
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    HttpCode,
    HttpStatus, ParseBoolPipe,
    Post,
    Put,
    Query,
    UseGuards
} from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";
import {CurrentUser} from "../../core/decorators/user.decorator";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";
import {CallService} from "../services/call.service";
import {InitiateCallDto} from "../dto/initiate-call.dto";
import {Call, CallDocument} from "../../core/schemas/call.schema";
import {AnswerCallDto} from "../dto/answer-call.dto";
import {ConnectCallDto} from "../dto/connect-call.dto";
import {CallMemberLink, CallMemberLinkDocument} from "../../core/schemas/call-member-link.schema";
import {CallMemberService} from "../services/call-member.service";
import {CallMemberDocument} from "../../core/schemas/call-member.schema";
import {ProfileService} from "../services/profile.service";
import {ValidateUserPipe} from "../pipes/validate-user.pipe";

@Controller('calls')
@UseGuards(AuthGuard('jwt'))
export class CallController
{
    constructor(
        private readonly service: CallService,
        private readonly memberService: CallMemberService,
        private readonly profileService: ProfileService
    ) {
    }

    @Get('list')
    async list(
        @CurrentUser() user: ClientUserDocument,
        @Query('isDirect', new DefaultValuePipe(false), ParseBoolPipe) isDirect: boolean,
        @Query('lastDate') lastDate: Date = null,
        @Query('latestId') latestId: string = null
    )
    {
        const calls: CallDocument[] = await this.service.getList(user, { lastDate, latestId }, isDirect);

        const userHash = {};
        calls.forEach(call => {
            call.members.forEach(member => {
                if (!userHash[member.user.id])
                {
                    userHash[member.user.id] = member.user;
                }
            })
        });

        const banStatuses = await this.profileService.getBanStatuses(user, Object.values(userHash));

        const result = calls.map((call) => {

            return {
                // @ts-ignore
                ...call.serialize(),
                members: call.members.map(member => {
                    return {
                        // @ts-ignore
                        ...member.serialize(),
                        // @ts-ignore
                        user: member.user.serialize()
                    };
                })
            }
        });

        return {
            calls: result,
            banStatuses
        };
    }

    @Post('initiate')
    @HttpCode(HttpStatus.CREATED)
    async initiate(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'addresseeId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe, ValidateUserPipe) addressee: ClientUserDocument,
        @Body() data: InitiateCallDto
    )
    {
        const call: CallDocument = await this.service.initiate(user, addressee, data);
        const members: CallMemberDocument[] = await this.memberService.getMembers(call);

        const result: any = {
            // @ts-ignore
            ...call.serialize(),
            members: []
        };

        members.forEach(member => {
           result.members.push(
               {
                   // @ts-ignore
                   ...member.serialize(),
                   // @ts-ignore
                   user: member.user.serialize()
               }
           );
        });

        return result;
    }

    @Put('answer')
    @HttpCode(HttpStatus.OK)
    async answer(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: Call.name,
            field: 'id',
            paramName: 'callId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) call: CallDocument,
        @Body() data: AnswerCallDto
    )
    {
        await this.service.answer(user, call, data);
    }

    @Put('connect')
    @HttpCode(HttpStatus.OK)
    async connect(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: CallMemberLink.name,
            field: 'id',
            paramName: 'linkId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) link: CallMemberLinkDocument,
        @Body() data: ConnectCallDto
    )
    {
        await this.service.connect(user, link, data);
    }

    @Put('reject/:callId')
    @HttpCode(HttpStatus.OK)
    async reject(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: Call.name,
            field: 'id',
            paramName: 'callId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) call: CallDocument,
    )
    {
        await this.service.reject(user, call);
    }

    @Put('hang-up/:callId')
    @HttpCode(HttpStatus.OK)
    async hangUp(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: Call.name,
            field: 'id',
            paramName: 'callId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) call: CallDocument
    )
    {
        await this.service.hangUp(user, call);
    }
}