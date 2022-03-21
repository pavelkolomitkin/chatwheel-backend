import {StatisticBaseService} from './statistic-base.service';
import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Call, CallDocument} from '../../../core/schemas/call.schema';
import {Model} from 'mongoose';

@Injectable()
export class CallStatisticsService extends StatisticBaseService
{
    constructor(
        @InjectModel(Call.name) private readonly model: Model<CallDocument>
    ) {
        super();
    }

    getNumber(isDirect: boolean = null)
    {
        const filter: any = {};

        if (isDirect !== null)
        {
            filter.isDirect = isDirect;
        }

        return this.model.find(filter).count();
    }

    async getMonthStatistics(startMonth: Date, endMonth: Date, isDirect: boolean = null)
    {
        const startFilter: Date = this.getStartMonthTime(startMonth);
        const endFilter: Date = this.getEndMonthTime(endMonth);

        const andMatchFilter: any[] = [
            { createdAt: { $gte: startFilter } },
            { createdAt: { $lte: endFilter } }
        ];

        if (isDirect !== null)
        {
            andMatchFilter.push(
                { isDirect: isDirect }
            );
        }

        const data: any = await this.model.aggregate([
            {
                $match: {
                    $and: andMatchFilter
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    total: { $sum: 1 }
                }
            }
        ]);


        const result: any = {};

        data.forEach(item => {

            const year: number = item._id.year;
            const month: number = item._id.month;

            if (typeof result[year] === 'undefined')
            {
                result[year] = {};
            }

            result[year][month] = item.total;
        });

        return result;
    }
}