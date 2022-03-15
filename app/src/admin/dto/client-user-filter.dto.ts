import {AuthUserTypes} from "../services/client-user.service";
import {SortingType} from "../../core/models/data/sorting-type.enum";

export class ClientUserFilterDto
{
    sortField?: string;
    sortType?: SortingType;
    userType?: AuthUserTypes;
    isActivated?: boolean;
    isBlocked?: boolean;
    residenceCountry?: string;
    deleted?: boolean;
}