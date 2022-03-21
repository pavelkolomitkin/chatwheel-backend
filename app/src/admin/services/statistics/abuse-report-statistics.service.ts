import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {AbuseReport, AbuseReportDocument} from '../../../core/schemas/abuse-report.schema';
import {Model} from 'mongoose';
import {AbuseReportType, AbuseReportTypeDocument} from '../../../core/schemas/abuse-report-type.schema';
import {StatisticBaseService} from './statistic-base.service';

@Injectable()
export class AbuseReportStatisticsService extends StatisticBaseService
{
    constructor(
        @InjectModel(AbuseReport.name) private readonly model: Model<AbuseReportDocument>,
        @InjectModel(AbuseReportType.name) private readonly typeModel: Model<AbuseReportTypeDocument>
    ) {
        super();
    }

    getTotalNumber(isNew: boolean = null)
    {
        const filter: any = {};
        if (isNew)
        {
            filter.new = true
        }

        return this.model.find(filter).count();
    }

    async getTypeNumbers(isNew: boolean = false)
    {
        const matchFilter: any = {};
        if (isNew)
        {
            matchFilter.new = true;
        }

        const data = await this.model.aggregate([
            {
                $match: matchFilter
            },
            {
                $lookup: {
                    from: 'abusereporttypes', localField: 'type', foreignField: '_id', as: 'abuseType'
                }
            },
            {
                $unwind: '$abuseType'
            },
            {
                $group: {
                    _id: '$abuseType',
                    totalNumber: { $sum: 1 }
                }
            },
            {
                $project: { abuseType: 1, totalNumber: 1 }
            }
        ]);

        return data.map(item => {
            item.abuseType = {
                ...item._id,
                id: item._id._id.toString()
            };

            return item;
        });
    }

    async getMonthStatistics(startMonth: Date, endMonth: Date)
    {

        const startFilter: Date = this.getStartMonthTime(startMonth);
        const endFilter: Date = this.getEndMonthTime(endMonth);

        const andMatchFilter: any[] = [
            { createdAt: { $gte: startFilter } },
            { createdAt: { $lte: endFilter } }
        ];

        const data = await this.model.aggregate([
            {
                $match: {
                    $and: andMatchFilter
                }
            },
            {
                $lookup: {
                    from: 'abusereporttypes',
                    localField: 'type',
                    foreignField: '_id',
                    as: 'abuseType'
                }
            },
            {
                $unwind: '$abuseType'
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt'},
                        month: { $month: '$createdAt' },
                        abuseType: '$abuseType'
                    },
                    total: { $sum: 1 }
                }
            }
        ]);

        const result: any = {};

        data.forEach(item => {

            const abuseTypeId: string = item._id.abuseType._id.toString();
            const year: number = item._id.year;
            const month: number = item._id.month;

            if (typeof result[abuseTypeId] === 'undefined')
            {
                result[abuseTypeId] = {};
            }

            if (typeof result[abuseTypeId][year] === 'undefined')
            {
                result[abuseTypeId][year] = {};
            }

            result[abuseTypeId][year][month] = item.total;
        });
        return result;
    }
}