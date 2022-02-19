import {BadRequestException, Injectable} from "@nestjs/common";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {Model, Types} from "mongoose";

@Injectable()
export class UserConversationService
{
    constructor(
        @InjectModel(ConversationMessageList.name) private model: Model<ConversationMessageListDocument>
    ) {
    }

    getConversations(user: ClientUserDocument, criteria: any)
    {
        const filter: Object = {};

        this.handleLatestId(filter, criteria);
        this.handleLastDate(filter, criteria);

        return this
            .model
            .find(filter)
            .populate('conversation')
            .populate('conversation.members.$*member')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .limit(10)
        ;
    }

    handleLastDate(filter: any, criteria: any)
    {
        if (criteria.lastDate)
        {
            filter.updatedAt = {
                $lte: criteria.lastDate
            }
        }
    }

    handleLatestId(filter: any, criteria: any)
    {
        if (criteria.latestId)
        {
            filter._id = {
                $ne : new Types.ObjectId(criteria.latestId)
            }
        }
    }

    async getIndividualConversationMessageList(user: ClientUserDocument, addressee: ClientUserDocument)
    {
        const items: Array<any> = await this.model.aggregate([
            { $match: { owner: user._id } },
            { $lookup: { from: 'conversations', localField: 'conversation', foreignField: '_id', as: 'conversation' } },
            { $match: { 'conversation.members':  {
                $all: [
                    { $elemMatch: { member: user._id} },
                    { $elemMatch: { member: addressee._id } }
                ]
            }, 'conversation.isIndividual': true } },
            { $lookup: { from: 'users', localField: 'conversation.members.member', foreignField: '_id', as: 'members' } },
            { $project: { _id: 1 } }
        ])
            .limit(1);

        if (items.length > 0)
        {
            const result: ConversationMessageListDocument = await this.model.findOne({ _id: items[0]._id});

            await result.populate('lastMessage');
            if (!!result.lastMessage)
            {
                await result.lastMessage.populate('message');
                await result.lastMessage.message.populate('author');
            }

            return result;
        }

        throw new BadRequestException('The conversation is not found!');
    }
}