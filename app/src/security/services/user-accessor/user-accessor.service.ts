import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ROLE_CLIENT_USER, User, UserDocument} from "../../../core/schemas/user.schema";
import {Model, Types} from "mongoose";
import {UserAccessorException} from "./exceptions/user-accessor.exception";
import {ClientUser, ClientUserDocument, SocialMediaType} from "../../../core/schemas/client-user.schema";

@Injectable()
export class UserAccessorService
{
    constructor(
        @InjectModel(User.name) private readonly model: Model<UserDocument>,
        @InjectModel(ClientUser.name) private readonly clientUserModel: Model<ClientUserDocument>
    ) {
    }

    getCommonActualUserFilter()
    {
        return {
            deleted: { $ne: true },
            isBlocked: { $ne: true }
        }
    }

    getActualFilter(additions: Object)
    {
        return {
            ...this.getCommonActualUserFilter(),
            ...additions
        };
    }

    async getActualUser(filter: any, model: Model<any>)
    {
        const result: UserDocument = await model.findOne(filter);
        if (!result)
        {
            throw new UserAccessorException();
        }

        this.validateClientUser(result);
        await this.populateCommonFields(result);

        return result;
    }

    async populateCommonFields(user: UserDocument)
    {
        if (user.roles.includes(ROLE_CLIENT_USER))
        {
            await (<ClientUserDocument>user).populate(ClientUser.COMMON_POPULATED_FIELDS.join(' '));
        }
    }

    validateClientUser(user: UserDocument)
    {
        if (user.roles.includes(ROLE_CLIENT_USER))
        {
            if (!(<ClientUserDocument>user).isActivated)
            {
                throw new UserAccessorException();
            }
        }
    }

    async getActualUserById(id: string)
    {
        const filter = this.getActualFilter({
            _id: new Types.ObjectId(id)
        });

        return this.getActualUser(filter, this.model);
    }


    async getActualUserByEmail(email: string)
    {
        const filter = this.getActualFilter({
            email: email
        });

        return this.getActualUser(filter, this.model);
    }
}