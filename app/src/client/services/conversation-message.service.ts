import {BadRequestException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ConversationMessage, ConversationMessageDocument} from "../../core/schemas/conversation-message.schema";
import {Model, Types} from "mongoose";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ProfileService} from "./profile.service";
import {ConversationDocument} from "../../core/schemas/conversation.schema";
import {ConversationService} from "./conversation.service";
import {Message, MessageDocument} from "../../core/schemas/message.schema";
import {ConversationMessageListService} from "./conversation-message-list.service";
import {SentMessageUserDto} from "../dto/sent-message-user.dto";
import {SentMessageConversationDto} from "../dto/sent-message-conversation.dto";
import {EditMessageDto} from "../dto/edit-message.dto";
import {RemoveMessageDto} from "../dto/remove-message.dto";

@Injectable()
export class ConversationMessageService
{
    constructor(
        @InjectModel(ConversationMessage.name) private readonly model: Model<ConversationMessageDocument>,
        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
        @InjectModel(ClientUser.name) private readonly userModel: Model<ClientUserDocument>,
        private readonly messageListService: ConversationMessageListService,

        private readonly profileService: ProfileService,
        private readonly conversationService: ConversationService
    ) {    }


    async getList(list: ConversationMessageListDocument, criteria: any, limit: number = 10)
    {

        const pipeline = [
            { $match: { messageList: list._id } },
            { $lookup: { from: 'messages', localField: 'message', foreignField: '_id', as: 'message'} },
            { $unwind: '$message' },
            { $sort: { 'message.createdAt': -1 } },
            { $project: { _id: 1 } }
        ]

        this.handleLatestMessage(pipeline, criteria);
        this.handleMessageLastDate(pipeline, criteria)

        // @ts-ignore
        const items = await this.model.aggregate(pipeline).limit(limit);
        const messageIds = items.map(item => item._id);

        const messages = await this.model.find({
            _id: {
                $in : messageIds
            }
        })
            .populate({
                path: 'message',
                populate: { path: 'author' }
            });

        const result = [];
        for (let message of messages)
        {
            const item = {
                id: message.id,
                isRead: message.isRead,
                // @ts-ignore
                message: message.message.serialize()
            };

            // @ts-ignore
            item.message.author = message.message.author.serialize();

            result.push(item);
        }

        return result;
    }

    handleMessageLastDate(pipeline: Array<any>, criteria: any)
    {
        if (criteria.lastDate)
        {
            pipeline.push({ $match: { 'message.createdAt': { $lte: criteria.lastDate } }  });
        }
    }

    handleLatestMessage(pipeline: Array<any>, criteria: any)
    {
        if (criteria.latestId)
        {
            pipeline.push({ $match: { message: { $ne: new Types.ObjectId(criteria.latestId) } } });
        }
    }

    async sendToUser(data: SentMessageUserDto, user: ClientUserDocument, addressee: ClientUserDocument): Promise<ConversationMessageDocument>
    {
        const isUserBanned: boolean = await this.profileService.isAddresseeBanned(addressee, user);
        if (isUserBanned)
        {
            throw new BadRequestException("You've been banned by the user!");
        }

        let conversation: ConversationDocument = await this.conversationService.getIndividual(user, addressee);
        if (!conversation)
        {
            conversation = await this.conversationService.createIndividual(user, addressee);
        }

        let userMessageList: ConversationMessageListDocument = await this.messageListService.get(user, conversation);
        if (!userMessageList)
        {
            userMessageList = await this.messageListService.create(user, conversation);
        }

        let addresseeMessageList: ConversationMessageListDocument = await this.messageListService.get(addressee, conversation);
        if (!addresseeMessageList)
        {
            addresseeMessageList = await this.messageListService.create(addressee, conversation);
        }

        // create a new message
        const message: MessageDocument = new this.messageModel({
            conversation: conversation,
            author: user,
            text: data.text
        })
        await message.save();

        // create conversation messages
        const userConversationMessage: ConversationMessageDocument = await this.create(userMessageList, message, true);
        const addresseeConversationMessage: ConversationMessageDocument = await this.create(addresseeMessageList, message, false);

        // create a conversation message for user
        userMessageList.lastMessage = userConversationMessage;
        // create a conversation message for addressee
        addresseeMessageList.lastMessage = addresseeConversationMessage;

        await userMessageList.save();
        await addresseeMessageList.save();

        return userConversationMessage;
    }

    async sendToConversation(data: SentMessageConversationDto, user: ClientUserDocument, conversation: ConversationDocument): Promise<ConversationMessageDocument>
    {

        let result: ConversationMessageDocument = null;

        const message: MessageDocument = new this.messageModel({
            conversation: conversation,
            author: user,
            text: data.text
        });
        await message.save();


        const lists: ConversationMessageListDocument[] = await this.messageListService.getConversationLists(conversation);

        await conversation.populate('members.member');
        for (let memberItem of conversation.members)
        {
            // @ts-ignore
            const { member } = memberItem;

            let list: ConversationMessageListDocument = lists.find(item => item.owner.id === member.id);
            if (!list)
            {
                list = await this.messageListService.create(member, conversation, message);
            }

            const isUserMessage: boolean = user.id === member.id;
            const conversationMessage: ConversationMessageDocument = await this.create(list, message, isUserMessage);

            list.lastMessage = conversationMessage;
            await list.save();

            if (isUserMessage)
            {
                result = conversationMessage;
            }
        }


        return result;
    }

    async create(list: ConversationMessageListDocument, message: MessageDocument, isRead: boolean): Promise<ConversationMessageDocument>
    {
        const result: ConversationMessageDocument = new this.model({
            messageList: list,
            message: message,
            isRead: isRead
        });

        await result.save();

        return result;
    }

    async editMessage(data: EditMessageDto, conversationMessage: ConversationMessageDocument)
    {
        await conversationMessage.populate('message');

        const message: MessageDocument = conversationMessage.message;
        message.text = data.text;

        await message.save();
        conversationMessage.message = message;

        return conversationMessage;
    }

    async removeMessage(data: RemoveMessageDto, conversationMessage: ConversationMessageDocument, user: ClientUserDocument)
    {
        const { removeFromOthers } = data;

        await conversationMessage.populate('message');
        const message: MessageDocument = conversationMessage.message;

        // remove the own conversation message
        await conversationMessage.populate('messageList');
        const userMessageList: ConversationMessageListDocument = conversationMessage.messageList;

        await userMessageList.populate('lastMessage');
        if (!!userMessageList.lastMessage && (userMessageList.lastMessage.id === message.id))
        {
            userMessageList.lastMessage = null;
            await userMessageList.save();
        }

        await conversationMessage.remove();

        // trying to remove the message from others
        if (removeFromOthers)
        {
            await message.populate('author');
            if (message.author.id !== user.id)
            {
                throw new BadRequestException('You cannot remove the message for other people!');
            }

            await this.model.remove({
                message: message
            });

            await this.messageListService.removeAllLastMessages(message);
        }
    }
}