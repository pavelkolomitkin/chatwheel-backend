import {BaseService} from "../base.service";
import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ClientUser, ClientUserDocument, SocialMediaType} from "../../../core/schemas/client-user.schema";
import {Model} from "mongoose";
import {AuthUserTypes} from "../../../core/models/data/auth-user-type.enum";

@Injectable()
export class ClientUserStatisticsService extends BaseService
{
    constructor(
        @InjectModel(ClientUser.name) private readonly model: Model<ClientUserDocument>
    ) {
        super();
    }


    getNumber(type: AuthUserTypes = null)
    {
        let filter = {};

        const typeCriteria = this.getUserTypeSearchCriteria(type);
        if (typeCriteria)
        {
            filter = typeCriteria;
        }

        return this.model.find(filter).count();
    }

    getUserTypeSearchCriteria(type: AuthUserTypes = null)
    {
        switch (type)
        {
            case AuthUserTypes.EMAIL:
                // @ts-ignore
                return {email : { $ne: null} } ;

            case AuthUserTypes.VK:
                // @ts-ignore
                return { socialMediaType: SocialMediaType.VK };

            default:
                return null;
        }
    }

    getEndMonthTime(month: Date)
    {
        const endDay: number = (new Date(month.getFullYear(), month.getMonth() + 1, 0)).getDate();

        return new Date(month.getFullYear(), month.getMonth(), endDay, 23, 59, 59);
    }

    getStartMonthTime(month: Date)
    {
        return new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0);
    }

    async getMonthsStatistics(startMonth: Date = null, endMonth: Date = null, authType: AuthUserTypes = null)
    {
        const startFilter: Date = this.getStartMonthTime(startMonth);
        const endFilter: Date = this.getEndMonthTime(endMonth);

        const andMatchFilter: any[] = [
            { createdAt: { $gte: startFilter } },
            { createdAt: { $lte: endFilter } }
        ];

        if (authType !== null)
        {
            andMatchFilter.push(this.getUserTypeSearchCriteria(authType));
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
                        year: { $year: '$createdAt'},
                        month: { $month: '$createdAt' }
                    },
                    total: { $sum: 1 }
                }
            }
        ]);

        return data;
    }
}