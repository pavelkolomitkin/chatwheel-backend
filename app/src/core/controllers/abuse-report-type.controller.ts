import {Controller, Get} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {AbuseReportType, AbuseReportTypeDocument} from "../schemas/abuse-report-type.schema";
import {Model} from "mongoose";

@Controller('abuse-report-type')
export class AbuseReportTypeController
{
    constructor(
        @InjectModel(AbuseReportType.name) private readonly model: Model<AbuseReportTypeDocument>
    ) {
    }

    @Get('list')
    async list()
    {
        const list: AbuseReportTypeDocument[] = await this.model.find();

        return {
            list: list.map(item => item.toJSON())
        };
    }
}