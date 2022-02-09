import {BadRequestException, Injectable} from "@nestjs/common";
import {UserInterestDto} from "../dto/user-interest.dto";
import {UserInterest, UserInterestDocument} from "../../core/schemas/user-interest.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model, Types} from "mongoose";
import {getPageLimitOffset} from "../../core/utils";

@Injectable()
export class UserInterestService
{
    static SEARCH_CRITERION_NAME = 'name';

    constructor(
        @InjectModel(UserInterest.name) private readonly model: Model<UserInterestDocument>,
    ) {
    }

    async getList(criteria: Object, page: number = 1): Promise<UserInterestDocument[]>
    {
        const filter = {};
        const { limit, offset } = getPageLimitOffset(page);

        this.handleSearchByName(criteria, filter);

        return this.model
            .find(filter)
            .skip(offset)
            .limit(limit);
    }

    handleSearchByName(criteria: Object, searchFilter: Object)
    {
        if (!!criteria[UserInterestService.SEARCH_CRITERION_NAME])
        {
            const name: string = criteria[UserInterestService.SEARCH_CRITERION_NAME].trim();
            searchFilter['name'] = '/^' + name + '/';
        }
    }

    async create(data: UserInterestDto): Promise<UserInterestDocument>
    {
        let result: UserInterestDocument = null;

        if (typeof data.id !== 'undefined')
        {
            result = await this.model.findOne(new Types.ObjectId(data.id));
        }
        else if ((typeof data.name !== 'undefined') && (data.name !== ''))
        {
            result = await this.model.findOne({ name: data.name });
            if (!result)
            {
                // @ts-ignore
                result = new this.model({ name: data.name });
                // @ts-ignore
                await interest.save();
            }
        }

        if (!result)
        {
            throw new BadRequestException('Cannot add this interest!');
        }

        return result;
    }
}