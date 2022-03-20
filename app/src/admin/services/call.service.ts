import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Call, CallDocument} from "../../core/schemas/call.schema";
import {Model, Query} from "mongoose";
import {CallListFilterDto} from "../dto/call-list-filter.dto";
import {BaseService} from "./base.service";
import {CallMember} from "../../core/schemas/call-member.schema";
import {ClientUser} from "../../core/schemas/client-user.schema";
import {SortingType} from "../../core/models/data/sorting-type.enum";

@Injectable()
export class CallService extends BaseService
{
    static AVAILABLE_SORT_FIELDS = {
        createdAt: 'createdAt',
    };

    constructor(
        @InjectModel(Call.name) private readonly model: Model<CallDocument>
    ) {
        super();
    }

    async getList(searchFilter: CallListFilterDto, page: number = 1)
    {
        const filter: any = {};

        this.handleSearchFilter(filter, searchFilter);

        debugger

        const query: Query<any, any> = this.model.find(filter);


        this.handleSortCriteria(query, searchFilter, CallService.AVAILABLE_SORT_FIELDS);
        this.handleSearchLimits(query, page, 20);

        const result: Call[] = await query
            .populate({
                path: 'members',
                model: CallMember.name,
                populate: {
                    path: 'user',
                    model: ClientUser.name
                }
            });

        return result;
    }

    handleSortCriteria(query: Query<any, any>, criteria: CallListFilterDto, availableFields: any) {

        if (!criteria.sortField)
        {
            criteria.sortField = 'createdAt';
            criteria.sortType = SortingType.DESC;
        }

        super.handleSortCriteria(query, criteria, availableFields);
    }

    handleSearchFilter(filter: any, criteria: CallListFilterDto)
    {
        const andMatchFilter: any[] = [];

        this.handleDirectSearchCriteria(andMatchFilter, criteria);
        this.handlePeriodSearchCriteria(andMatchFilter, criteria);

        if (andMatchFilter.length > 0)
        {
            filter.$and = andMatchFilter;
        }
    }

    handleDirectSearchCriteria(filter: any[], criteria: CallListFilterDto)
    {
        if (typeof criteria.isDirect !== 'undefined')
        {
            filter.push({ isDirect: (criteria.isDirect === 'true') });
        }
    }

    handlePeriodSearchCriteria(filter: any[], criteria: CallListFilterDto)
    {
        let startDate: Date = criteria.startDate;
        let endDate: Date = criteria.endDate;

        if (!endDate)
        {
            endDate = new Date();
        }

        if (!startDate)
        {
            startDate = new Date();
            startDate.setMonth(endDate.getMonth() - 1);
        }

        filter.push({
            $and: [
                { createdAt: { $gte: startDate } },
                { createdAt: { $lte: endDate } }
            ]
        });
    }

    async getNumber(searchFilter: CallListFilterDto)
    {
        const filter: any = {};

        this.handleSearchFilter(filter, searchFilter);

        return this.model.find(filter).count();
    }


}