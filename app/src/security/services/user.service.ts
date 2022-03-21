import {BaseService} from "./base.service";
import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../../core/schemas/user.schema";
import {Model, Types} from "mongoose";

@Injectable()
export class UserService extends BaseService
{
    constructor(
        @InjectModel(User.name) private readonly model: Model<UserDocument>
    ) {
        super();
    }

    getModel()
    {
        return this.model;
    }

    /**
     * @deprecated
     * @param id
     */
    getActivatedUserById(id: string)
    {
        return this.model
            .findOne({
            _id: new Types.ObjectId(id),
            isBlocked: { $ne: true },
            isDeleted: { $ne: true }
        });
    }

    getActualUser(id: string, roles: string[])
    {

    }

    getUserByEmail(email: string)
    {
        return this.model.findOne({email});
    }
}