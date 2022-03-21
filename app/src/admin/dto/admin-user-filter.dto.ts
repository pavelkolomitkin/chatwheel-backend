import {SortingType} from '../../core/models/data/sorting-type.enum';

export class AdminUserFilterDto
{
    email?: string;
    sortField?: string;
    sortType?: SortingType;
    isBlocked?: string;
    isDeleted?: string;
}