import {Injectable} from "@nestjs/common";
import {User, UserDocument} from "../../core/schemas/user.schema";

@Injectable()
export class BaseService
{
    static PASSWORD_HASH_SALT = 10;

    async updateLastActivity(user: UserDocument): Promise<void>
    {
        user.lastActivity = new Date();
        await user.save();
    }
}