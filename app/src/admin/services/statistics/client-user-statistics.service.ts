import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ClientUser, ClientUserDocument, SocialMediaType} from "../../../core/schemas/client-user.schema";
import {Model} from "mongoose";
import {AuthUserTypes} from "../../../core/models/data/auth-user-type.enum";
import {StatisticBaseService} from "./statistic-base.service";

@Injectable()
export class ClientUserStatisticsService extends StatisticBaseService
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



    async getMonthsStatistics(startMonth: Date, endMonth: Date, authType: AuthUserTypes = null)
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