import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {AbuseReport, AbuseReportDocument} from '../../core/schemas/abuse-report.schema';
import {Model, Query, Types} from 'mongoose';
import {ClientUser, ClientUserDocument} from '../../core/schemas/client-user.schema';
import * as _ from 'lodash';
import {AbuseReportFilterDto} from '../dto/abuse-report-filter.dto';
import {BaseService} from './base.service';
import {Country} from "../../core/schemas/country.schema";

@Injectable()
export class AbuseReportService extends BaseService
{

    static POPULATE_FIELDS = [
        'applicant',
        'respondent',
        'type'
    ]

    static AVAILABLE_SORT_FIELDS = {
        createdAt: 'createdAt',
    };


    constructor(
        @InjectModel(AbuseReport.name) private readonly model: Model<AbuseReportDocument>
    ) {
        super();
    }

    async getList(searchFilter: AbuseReportFilterDto, page: number = 1)
    {
        const filter: any = {};

        this.handleSearchCriteria(filter, searchFilter);

        const query: Query<any, any> = this
            .model
            .find(filter)
        ;

        this.handleSortCriteria(query, searchFilter, AbuseReportService.AVAILABLE_SORT_FIELDS);
        this.handleSearchLimits(query, page, 20);

        const result: AbuseReportDocument[] = await query
            .populate('type')
            .populate({
                path: 'applicant',
                model: ClientUser.name,
                populate: {
                    path: 'residenceCountry',
                    model: Country.name
                }
            })
            .populate({
                path: 'respondent',
                model: ClientUser.name,
                populate: {
                    path: 'residenceCountry',
                    model: Country.name
                }
            });

        return result;
    }

    getSearchNumber(searchFilter: AbuseReportFilterDto)
    {
        const filter = {};

        this.handleSearchCriteria(filter, searchFilter);

        return this
            .model
            .find(filter)
            .count()
        ;
    }

    handleSearchCriteria(filter: any, criteria: any)
    {
        const andMatchCriteria: any[] = [];

        this.handleNewSearchCriteria(andMatchCriteria, criteria);
        this.handleTypeSearchCriteria(andMatchCriteria, criteria);

        if (andMatchCriteria.length > 0)
        {
            filter.$and = andMatchCriteria;
        }
    }

    handleNewSearchCriteria(filter: any[], criteria: any)
    {
        if (criteria.new === 'true')
        {
            filter.push({ new: true });
        }
    }

    handleTypeSearchCriteria(filter: any[], criteria: any)
    {
        if (criteria.type)
        {
            filter.push({ type: new Types.ObjectId(criteria.type) })
        }
    }

    getNumber(isNew: boolean = false)
    {
        const filter: any = {};
        if (isNew)
        {
            filter.new = true;
        }

        return this.model.find(filter).count();
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
            .populate(AbuseReportService.POPULATE_FIELDS.join(' '));

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