import {ClientUserFilterDto} from "../dto/client-user-filter.dto";
import {Query} from "mongoose";
import {SortingType} from "../../core/models/data/sorting-type.enum";
import {getPageLimitOffset} from "../../core/utils";
import {locale} from "moment";

export class UserService
{
    handleBlockedSearchCriteria(filter: any[], criteria: any)
    {
        if (criteria.isBlocked === 'true')
        {
            filter.push({isBlocked: true})
        }
    }

    handleDeletedSearchCriteria(filter: any[], criteria: any)
    {
        if (criteria.isDeleted === 'true')
        {
            filter.push({ deleted: true });
        }
    }

    handleSortCriteria(query: Query<any, any>, criteria: any, availableFields: any)
    {
        const sortFieldName: string = availableFields[criteria.sortField];
        if (!sortFieldName)
        {
            return;
        }

        const sortFieldType: number = criteria.sortType === SortingType.ASC ? 1 : -1;

        query.sort({
            [sortFieldName]: sortFieldType
        }).collation({locale: 'en', strength: 1});
    }

    handleSearchLimits(query: Query<any, any>, page: number)
    {
        const { limit, offset } = getPageLimitOffset(page);

        query
            .skip(offset)
            .limit(limit);
    }
}