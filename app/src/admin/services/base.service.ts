import {Query} from "mongoose";
import {getPageLimitOffset} from "../../core/utils";
import {SortingType} from "../../core/models/data/sorting-type.enum";

export class BaseService
{
    handleSearchLimits(query: Query<any, any>, page: number, numberOnPage: number = 10)
    {
        const { limit, offset } = getPageLimitOffset(page, numberOnPage);

        query
            .skip(offset)
            .limit(limit);
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
}