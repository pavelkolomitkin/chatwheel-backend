import {Injectable} from "@nestjs/common";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model, Types} from "mongoose";

@Injectable()
export class UserProfileService
{
    constructor(
        @InjectModel(ClientUser.name) private readonly model: Model<ClientUserDocument>
    ) {}
}