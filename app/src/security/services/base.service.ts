import {Injectable} from "@nestjs/common";

@Injectable()
export class BaseService
{
    static PASSWORD_HASH_SALT = 10;
}