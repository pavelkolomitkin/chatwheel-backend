import {BadRequestException, Injectable} from "@nestjs/common";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {Model, Types} from "mongoose";
import {ConversationMessage, ConversationMessageDocument} from "../../core/schemas/conversation-message.schema";

@Injectable()
export class UserConversationService
{
    constructor(
        @InjectModel(ConversationMessageList.name) private readonly model: Model<ConversationMessageListDocument>,
        @InjectModel(ConversationMessage.name) private readonly conversationMessageModel: Model<ConversationMessageDocument>
    ) {
    }

    async getConversationsNewMessages(conversationMessageList: ConversationMessageListDocument[])
    {
        const ids: any[] =conversationMessageList.map(item => item._id);

        const newMessageNumbers = await this.conversationMessageModel.aggregate([
            { $match: { messageList: { $in: ids } } },
            { $group: {_id: '$messageList', newMessageNumber: {
                        $sum: {
                            $cond: ['$isRead', 0, 1]
                        }
            }}}
        ]);

        const result = {};

        newMessageNumbers.forEach(item => {
            result[item._id.toString()] = item.newMessageNumber;
        });

        return result
    }

    getConversations(user: ClientUserDocument, criteria: any, limit: number = 10)
    {
        const filter: Object = {
            owner: user._id
        };

        this.handleLatestId(filter, criteria);
        this.handleLastDate(filter, criteria);

        return this
            .model
            .find(filter)
            .populate({
                path: 'conversation',
                populate: {
                    path: 'members',
                    populate: {
                        path: 'member',
                        model: ClientUser.name
                    }
                }
            })
            .populate({
                path: 'lastMessage',
                model: 'ConversationMessage',
                populate: {
                    path: 'message',
                    model: 'Message',
                    populate: {
                        path: 'author',
                        model: ClientUser.name
                    }
                }
            })
            .sort({ updatedAt: -1 })
            .limit(limit)
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