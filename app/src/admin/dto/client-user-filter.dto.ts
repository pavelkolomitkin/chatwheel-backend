import {AuthUserTypes} from "../services/client-user.service";
import {SortingType} from "../../core/models/data/sorting-type.enum";

export class ClientUserFilterDto
{
    sortField?: string;
    sortType?: SortingType;
    authType?: AuthUserTypes;
    isNotActivated?: string;
    isBlocked?: string;
    residenceCountry?: string;
    searchCountry?: string;
    isDeleted?: string;
}