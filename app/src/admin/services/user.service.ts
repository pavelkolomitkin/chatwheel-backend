import {BaseService} from './base.service';


export class UserService extends BaseService
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

}