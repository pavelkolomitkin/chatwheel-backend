import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {AbuseReport, AbuseReportDocument} from "../../core/schemas/abuse-report.schema";
import {Model} from "mongoose";

@Injectable()
export class AbuseReportService
{
    constructor(
        @InjectModel(AbuseReport.name) private readonly model: Model<AbuseReportDocument>
    ) {
    }

    getNewNumber()
    {
        return this.model.find({
            new: true
        }).count();
    }
}