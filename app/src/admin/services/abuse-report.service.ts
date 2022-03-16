import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {AbuseReport, AbuseReportDocument} from "../../core/schemas/abuse-report.schema";
import {Model, Types} from "mongoose";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import * as _ from 'lodash';

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

    async getPeopleNumberApplied(addressee: ClientUserDocument)
    {
        const result = await this.model.aggregate([
            {
                $match: {
                    respondent: addressee._id
                }
            },
            {
                $group: {
                    _id: '$applicant'
                }
            },
            {
                $count: 'peopleNumber'
            }
        ]);

        return (result.length > 0) ? result[0]['peopleNumber'] : 0;
    }

    async getReportNumberReceived(addressee: ClientUserDocument, isNew: boolean = false)
    {
        const filter = {
            respondent: addressee._id
        };

        if (isNew)
        {
            // @ts-ignore
            filter.new = true
        }

        const result = await this.model.aggregate([
            {
                $match: filter
            },
            {
                $count: 'reportNumber'
            }
        ]);

        return (result.length > 0) ? result[0]['reportNumber'] : 0;
    }

    async getAddresseeList(addressee: ClientUserDocument, criteria: any, limit: number = 10)
    {
        const filter: any = {
            respondent: addressee._id
        };

        this.handleLastDate(filter, criteria);
        this.handleLastId(filter, criteria);

        const reports: AbuseReportDocument[] = await this.model
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('applicant respondent type');

        if (reports.length === 0)
        {
            return [];
        }

        let applicantIds = reports.map(item => item.applicant.id);
        applicantIds = _.uniq(applicantIds);

        const reportNumbers = await this.model.aggregate([
            {
                $match: {
                    respondent: addressee._id,
                    applicant: { $in: applicantIds.map(id => new Types.ObjectId(id)) }
                }
            },
            {
                $group: {
                    _id: '$applicant',
                    reportNumber: { $sum: 1 }
                }
            }
        ]);

        const result = [];
        for (let report of reports)
        {
            const number = reportNumbers.find(item => item._id.toString() === report.applicant.id);
            result.push({
                report,
                reportNumber: !!number ? number.reportNumber : 0
            });
        }

        return result;
    }

    handleLastDate(filter: any, criteria: any)
    {
        if (criteria.lastDate)
        {
            filter.createdAt = { $lte: criteria.lastDate };
        }
    }

    handleLastId(filter: any, criteria: any)
    {
        if (criteria.latestId)
        {
            filter._id = {
                $ne: new Types.ObjectId(criteria.latestId)
            };
        }
    }

    async read(report: AbuseReportDocument)
    {
        report.new = false;
        await report.save();

        return report;
    }
}