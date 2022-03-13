import {AuthUserTypes} from "../services/client-user.service";

export class ClientUserFilterDto
{
    sortField?: string;
    sortType?: string;
    userType?: AuthUserTypes;
    isActivated?: boolean;
    isBlocked?: boolean;
    residenceCountry?: string;
    deleted?: boolean;
}