import {Body, Controller, Post, UseGuards} from "@nestjs/common";
import {CurrentUser} from "../../core/decorators/user.decorator";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {AbuseReportDto} from "../dto/abuse-report.dto";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";
import {AbuseReportType, AbuseReportTypeDocument} from "../../core/schemas/abuse-report-type.schema";
import {AbuseReportService} from "../services/abuse-report.service";
import {AbuseReportDocument} from "../../core/schemas/abuse-report.schema";
import {AuthGuard} from "@nestjs/passport";
import {ProfileService} from "../services/profile.service";

@Controller('abuse-report')
@UseGuards(AuthGuard('jwt'))
export class AbuseReportController
{
    constructor(
        private readonly service: AbuseReportService,
        private readonly profileService: ProfileService
    ) {
    }

    @Post('')
    async create(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'recipientId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) recipient: ClientUserDocument,
        @ParameterConverter({
            model: AbuseReportType.name,
            field: 'id',
            paramName: 'typeId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) type: AbuseReportTypeDocument,
        @Body() data: AbuseReportDto
    )
    {
        const report: AbuseReportDocument = await this.service.create(user, recipient, type, data);

        const result = {
            // @ts-ignore
            user: report.respondent.serialize(),
            amIBanned: await this.profileService.isAddresseeBanned(recipient, user),
            isBanned: await this.profileService.isAddresseeBanned(user, recipient),
        };


        return result;
    }
}