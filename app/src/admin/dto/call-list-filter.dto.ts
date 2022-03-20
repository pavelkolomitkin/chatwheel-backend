import {SortingType} from "../../core/models/data/sorting-type.enum";

export class CallListFilterDto
{
    startDate: Date;
    endDate: Date;
    sortField?: string;
    sortType?: SortingType;
    isDirect?: string;
}