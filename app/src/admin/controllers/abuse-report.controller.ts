import {Controller, Get, ParseBoolPipe, ParseIntPipe, Put, Query, UseGuards} from "@nestjs/common";
import {Roles} from "../../core/decorators/role.decorator";
import {ROLE_ADMIN_USER} from "../../core/schemas/user.schema";
import {AuthGuard} from "@nestjs/passport";
import {RoleBasedGuard} from "../../core/guards/role-based.guard";
import {AbuseReportService} from "../services/abuse-report.service";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";
import {AbuseReport, AbuseReportDocument} from "../../core/schemas/abuse-report.schema";

@Controller('abuse-report')
@Roles(ROLE_ADMIN_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class AbuseReportController
{
    constructor(
        private readonly service: AbuseReportService
    ) {
    }

    @Get('new-number')
    async getNewNumber()
    {
        const number: number = await this.service.getNewNumber();

        return {
            number
        };
    }

    @Get('people-applied/:addresseeId')
    async getPeopleNumberApplied(
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'addresseeId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) addressee: ClientUserDocument
    )
    {
        const result: number = await this.service.getPeopleNumberApplied(addressee);

        return {
            number: result
        };
    }

    @Get('report-number-received/:addresseeId')
    async getReportNumberReceived(
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'addresseeId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) addressee: ClientUserDocument
    )
    {
        const total: number = await this.service.getReportNumberReceived(addressee);
        const newNumber: number = await this.service.getReportNumberReceived(addressee, true);

        return {
            total: total,
            newNumber: newNumber
        };
    }

    @Get('addressee-reports/:addresseeId')
    async getAddresseeList(
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'addresseeId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) addressee: ClientUserDocument,
        @Query('lastDate') lastDate: Date = null,
        @Query('latestId') latestId: string = null
    )
    {
        const reports = await this.service.getAddresseeList(addressee, {lastDate, latestId});

        return {
            reports: reports.map((item) => {
                return {
                    ...item,
                    // @ts-ignore
                    report: item.report.serialize(['admin'])
                }
            })
        };
    }

    @Put('read-report/:id')
    async read(
        @ParameterConverter({
            model: AbuseReport.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) report: AbuseReportDocument,
    )
    {
        const updatedReport: AbuseReportDocument = await this.service.read(report);
        await updatedReport.populate('type applicant respondent');

        return {
            // @ts-ignore
            report: updatedReport.serialize(['admin'])
        };
    }
}