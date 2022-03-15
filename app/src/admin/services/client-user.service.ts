import {BadRequestException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ClientUser, ClientUserDocument, SocialMediaType} from "../../core/schemas/client-user.schema";
import {Model, Types, Query} from 'mongoose';
import {ClientUserFilterDto} from "../dto/client-user-filter.dto";
import {getPageLimitOffset} from "../../core/utils";

export enum AuthUserTypes {
    EMAIL,
    VK
}


@Injectable()
export class ClientUserService
{
    static NUMBER_ITEMS_ON_PAGE = 10;

    static AVAILABLE_SORT_FIELD = {
        lastActivity: 'lastActivity',
        fullName: 'fullName',
        signUp: 'createdAt'
    };

    constructor(
        @InjectModel(ClientUser.name) private readonly model: Model<ClientUserDocument>
    ) {
    }

    async getList(searchFilter: ClientUserFilterDto, page: number = 1): Promise<ClientUserDocument[]>
    {
        const filter: any = {};

        this.handleSearchFilter(filter, searchFilter);

        const query = this
            .model
            .find(filter)
            .populate(ClientUser.COMMON_POPULATED_FIELDS.join(' '));

        this.handleSortCriteria(query, searchFilter);
        this.handleSearchLimits(query, page);

        return query;
    }

    async getListTotalUserNumber(searchFilter: ClientUserFilterDto)
    {
        const filter: any = {};

        this.handleSearchFilter(filter, searchFilter);

        const query = this.model.find(filter);
        return query.count();
    }

    handleSearchLimits(query: Query<any, any>, page: number)
    {
        const { limit, offset } = getPageLimitOffset(page, ClientUserService.NUMBER_ITEMS_ON_PAGE);

        query
            .skip(offset)
            .limit(limit);
    }

    handleSortCriteria(query: Query<any, any>, criteria: ClientUserFilterDto)
    {
        const sortFieldName: string = ClientUserService.AVAILABLE_SORT_FIELD[criteria.sortField];
        if (!sortFieldName)
        {
            return;
        }

        const sortFieldType: number = criteria.sortType === 'ask' ? 1 : -1;

        query.sort({
            [sortFieldName]: sortFieldType
        });
    }

    handleSearchFilter(filter: any, criteria: ClientUserFilterDto)
    {
        if (criteria.isActivated)
        {
            filter.isActivated = true
        }
        else
        {
            const andMatchCriteria = [];

            this.handleUserTypeSearchCriteria(andMatchCriteria, criteria);
            this.handleBlockedSearchCriteria(andMatchCriteria, criteria);
            this.handleDeletedSearchCriteria(andMatchCriteria, criteria);
            this.handleResidenceCountrySearchCriteria(andMatchCriteria, criteria);
        }
    }

    handleUserTypeSearchCriteria(filter: any[], criteria: ClientUserFilterDto)
    {
        const typeCriteria = this.getUserTypeSearchCriteria(criteria.userType);
        if (typeCriteria)
        {
            filter.push(typeCriteria);
        }
    }

    handleBlockedSearchCriteria(filter: any[], criteria: ClientUserFilterDto)
    {
        if (criteria.isBlocked)
        {
            filter.push({isBlocked: true})
        }
    }

    handleDeletedSearchCriteria(filter: any[], criteria: ClientUserFilterDto)
    {
        if (criteria.deleted)
        {
            filter.push({ deleted: true });
        }
    }

    handleResidenceCountrySearchCriteria(filter: any[], criteria: ClientUserFilterDto)
    {
        if (criteria.residenceCountry)
        {
            filter.push({ residenceCountry: new Types.ObjectId(criteria.residenceCountry) });
        }
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

    async block(user: ClientUserDocument, reason: string = null)
    {
        if (user.isBlocked)
        {
            throw new BadRequestException(`The user is already blocked!`);
        }

        user.isBlocked = true;
        user.blockingReason = reason;

        await user.save();

        return user;
    }

    async unBlock(user: ClientUserDocument)
    {
        if (!user.isBlocked)
        {
            throw new BadRequestException(`The user is not blocked yet!`);
        }

        user.isBlocked = false;

        await user.save();

        return user;
    }

    async delete(user: ClientUserDocument)
    {
        if (user.deleted)
        {
            throw new BadRequestException(`This user is already deleted!`);
        }

        user.deleted = true;
        user.deletedAt = new Date();

        await user.save();

        return user;
    }
}