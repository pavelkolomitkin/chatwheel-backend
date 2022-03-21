import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {AbuseReport, AbuseReportDocument} from "../../core/schemas/abuse-report.schema";
import {Model} from "mongoose";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {AbuseReportTypeDocument} from "../../core/schemas/abuse-report-type.schema";
import {AbuseReportDto} from "../dto/abuse-report.dto";
import {ProfileService} from "./profile.service";

@Injectable()
export class AbuseReportService
{
    constructor(
        @InjectModel(AbuseReport.name) private readonly model: Model<AbuseReportDocument>,
        private readonly profileService: ProfileService
    ) {
    }

    async create(
        applicant: ClientUserDocument,
        recipient: ClientUserDocument,
        type: AbuseReportTypeDocument,
        data: AbuseReportDto
    )
    {
        await this.profileService.banAddressee(applicant, recipient);

        const { comment } = data;
        const result: AbuseReportDocument = new this.model({
            type: type,
            applicant: applicant,
            respondent: recipient,
            description: comment,
            new: true
        });

        await result.save();

        return result;
    }
}