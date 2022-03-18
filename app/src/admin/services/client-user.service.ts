import {BadRequestException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ClientUser, ClientUserDocument, SocialMediaType} from "../../core/schemas/client-user.schema";
import {Model, Types} from 'mongoose';
import {ClientUserFilterDto} from "../dto/client-user-filter.dto";
import {BlockUserDto} from "../dto/block-user.dto";
import {UserService} from "./user.service";

export enum AuthUserTypes {
    EMAIL = 'email',
    VK = 'vk'
}


@Injectable()
export class ClientUserService extends UserService
{
    static AVAILABLE_SORT_FIELDS = {
        lastActivity: 'lastActivity',
        fullName: 'fullName',
        signUp: 'createdAt'
    };

    constructor(
        @InjectModel(ClientUser.name) private readonly model: Model<ClientUserDocument>
    ) {
        super();
    }

    async getList(searchFilter: ClientUserFilterDto, page: number = 1): Promise<ClientUserDocument[]>
    {
        const filter: any = {};

        this.handleSearchFilter(filter, searchFilter);

        const query = this
            .model
            .find(filter)
            .populate(ClientUser.COMMON_POPULATED_FIELDS.join(' '));

        this.handleSortCriteria(query, searchFilter, ClientUserService.AVAILABLE_SORT_FIELDS);
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

    handleSearchFilter(filter: any, criteria: ClientUserFilterDto)
    {
        const andMatchCriteria = [];

        this.handleUserTypeSearchCriteria(andMatchCriteria, criteria);
        this.handleBlockedSearchCriteria(andMatchCriteria, criteria);
        this.handleDeletedSearchCriteria(andMatchCriteria, criteria);
        this.handleResidenceCountrySearchCriteria(andMatchCriteria, criteria);
        this.handleSearchCountrySearchCriteria(andMatchCriteria, criteria);
        this.handleNotActivatedUserSearchCriteria(andMatchCriteria, criteria);

        if (andMatchCriteria.length > 0)
        {
            filter.$and = andMatchCriteria;
        }
    }

    handleNotActivatedUserSearchCriteria(filter: any[], criteria: ClientUserFilterDto)
    {

        if (criteria.isNotActivated === 'true')
        {
            filter.push({ isActivated: false });
        }
    }

    handleUserTypeSearchCriteria(filter: any[], criteria: ClientUserFilterDto)
    {
        const typeCriteria = this.getUserTypeSearchCriteria(criteria.authType);
        if (typeCriteria)
        {
            filter.push(typeCriteria);
        }
    }



    handleResidenceCountrySearchCriteria(filter: any[], criteria: ClientUserFilterDto)
    {
        if (criteria.residenceCountry)
        {
            filter.push({ residenceCountry: new Types.ObjectId(criteria.residenceCountry) });
        }
    }

    handleSearchCountrySearchCriteria(filter: any[], criteria: ClientUserFilterDto)
    {
        if (criteria.searchCountry)
        {
            filter.push({ searchCountry: new Types.ObjectId(criteria.searchCountry) });
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

    async block(user: ClientUserDocument, data: BlockUserDto)
    {
        if (user.isBlocked)
        {
            throw new BadRequestException(`The user is already blocked!`);
        }

        const { reason } = data;

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