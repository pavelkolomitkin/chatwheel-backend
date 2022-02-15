import {BadRequestException, Injectable, InternalServerErrorException} from "@nestjs/common";
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

    async create(name: string): Promise<UserInterestDocument>
    {
        let result: UserInterestDocument = await this.model.findOne({ name: name });
        if (!result)
        {
           result = new this.model({ name });

           try {
               // @ts-ignore
               await result.save();
           }
           catch (error)
           {
               throw new InternalServerErrorException('Cannot create this interest');
           }
        }

        return result;
    }
}