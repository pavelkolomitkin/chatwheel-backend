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

    async getAddresseeProfile(currentUser: ClientUserDocument, addresseeId: string)
    {
        //this.model.find({ _id: addresseeId }).select('+blackList').aggregate

        // const result = await this.model.aggregate([
        //     { $match: { _id: new Types.ObjectId(addresseeId) }},
        //     // { $addFields: { hasBannedUser: { $in: [currentUser.id, '$blackList'] } }}
        // ]);

        // debugger
        //
        // const profileIds = [];
        //
        // this.model.find({_id: { $in : profileIds }, blackList: currentUser.id}).select('_id');
        //

        // return result;
    }
}