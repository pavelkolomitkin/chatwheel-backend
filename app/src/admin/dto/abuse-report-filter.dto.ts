import {SortingType} from "../../core/models/data/sorting-type.enum";

export interface AbuseReportFilterDto
{
    new?: boolean;
    type?: string;

    sortField?: string;
    sortType?: SortingType;
}