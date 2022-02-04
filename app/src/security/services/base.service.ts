import {Injectable} from "@nestjs/common";
import {User} from "../../core/schemas/user.schema";

@Injectable()
export class BaseService
{
    static PASSWORD_HASH_SALT = 10;

    async updateLastActivity(user: User): Promise<void>
    {
        user.lastActivity = new Date();
        await user.save();
    }
}