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

    getActivatedUserById(id: string)
    {
        return this.model
            .findOne({
            _id: new Types.ObjectId(id),
            isActivated: true,
            isBlocked: false
        });
    }

    getUserByEmail(email: string)
    {
        return this.model.findOne({email});
    }
}