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

    async getList(user: ClientUserDocument, list: ConversationMessageListDocument, criteria: any, limit: number = 23)
    {
        await this.messageListService.validateOwnership(list, user);

        let pipeline = [
            { $match: { messageList: list._id } },
            { $lookup: { from: 'messages', localField: 'message', foreignField: '_id', as: 'message'} },
        ];

        const criteriaFilter: any = this.getCriteriaMatchFilter(criteria);
        if (criteriaFilter)
        {
            pipeline.push(criteriaFilter);
        }

        // @ts-ignore
        pipeline = pipeline.concat([
            { $unwind: '$message' },
            { $sort: { 'message.createdAt': -1 } },
            { $project: { _id: 1 } }
        ]);

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
            })
            .sort({ createdAt: -1 });

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

    getCriteriaMatchFilter(criteria: any)
    {
        const criteriaFilter = [];
        this.handleLatestMessageMatchCriterion(criteriaFilter, criteria);
        this.handleMessageLastDateMatchCriterion(criteriaFilter, criteria);

        if (criteriaFilter.length > 0)
        {
            return { $match: {
                    //@ts-ignore
                    $and: criteriaFilter
                }
            };
        }

        return null;
    }

    handleMessageLastDateMatchCriterion(matchCriteria: any[], criteria: any)
    {
        if (criteria.lastDate)
        {
             matchCriteria.push({ 'message.createdAt': { $lte: criteria.lastDate }});
        }
    }

    handleLatestMessageMatchCriterion(matchCriteria: any[], criteria: any)
    {
        if (criteria.latestId)
        {
            matchCriteria.push({ _id: { $ne: new Types.ObjectId(criteria.latestId) } });
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

    async sendToConversation(data: SentMessageConversationDto, user: ClientUserDocument, messageList: ConversationMessageListDocument)
        : Promise<ConversationMessageDocument>
    {
        // validated the conversation message list in order to check whether the user is an owner of the list
        await this.messageListService.validateOwnership(messageList, user);
        // validated the conversation message list on having the related conversation itself
        await messageList.populate('conversation');

        const conversation: ConversationDocument = messageList.conversation;
        if (!conversation)
        {
            throw new BadRequestException('The conversation is not found!');
        }

        // validated the user on membership of the conversation
        await this.conversationService.validateMembership(conversation, user);

        // if it's an individual conversation
            // check the user not being blocked by the addressee
        await this.validateBanStatus(conversation, user);

        // create a new message with the fields: conversation, author = user, and text = data.text
        const message: MessageDocument = new this.messageModel({
            conversation: conversation,
            author: user,
            text: data.text
        });
        await message.save();


        // fetch all the members of the conversation
        const members: ClientUserDocument[] = await this.conversationService.getMembers(conversation);
        // for optimization purposes, fetch all the conversation message lists related to the conversation
        const messageLists: ConversationMessageListDocument[] = await this
            .messageListService
            .getConversationMessageLists(conversation);

        // for each member
            // get the conversation message list from the just fetched message lists
            // if there is no one for a particular user
                // create a new one and attach it to the conversation and to the user as user being the owner of it
            // create a conversation message with the fields: conversation message list, message, isRead = true(if it's the
            // authorized user), otherwise isRead = false
            // if it's user's conversation message
                // put it into the result variable to be returned from the function

        let result: ConversationMessageDocument = null;
        for (let member of members)
        {
            let currentMessageList = messageLists.find(item => item.owner.id === member.id);
            if (!currentMessageList)
            {
                currentMessageList = await this.messageListService.create(member, conversation);
            }

            const isUsersMessage: boolean = user.id === member.id;

            const conversationMessage: ConversationMessageDocument = await this.create(
                currentMessageList,
                message,
                isUsersMessage
            );
            await conversationMessage.save();

            currentMessageList.lastMessage = conversationMessage;
            await currentMessageList.save();

            if (isUsersMessage)
            {
                result = conversationMessage;
            }
        }

        return result;
    }

    async validateOwnership(message: ConversationMessageDocument, user: ClientUserDocument)
    {
        await message.populate({
            path: 'messageList',
            model: ConversationMessageList.name,
            populate: {
                path: 'owner',
                model: ClientUser.name
            }
        });

        if (message.messageList.owner.id !== user.id)
        {
            throw new BadRequestException('The message is not found!');
        }
    }

    async validateMessageOwnership(message: MessageDocument, user: ClientUserDocument)
    {
        await message.populate({
            path: 'author',
            model: ClientUser.name
        });

        if (message.author.id !== user.id)
        {
            throw new BadRequestException('The message is not found!');
        }
    }

    async validateBanStatus(
        conversation: ConversationDocument,
        user: ClientUserDocument,
        errorMessage: string = "You've been banned by the user!"
    )
    {
        if (!conversation.isIndividual)
        {
            return;
        }

        const addressee: ClientUserDocument = await this.conversationService.getAddressee(conversation, user);
        if (!addressee)
        {
            return;
        }

        const isBanned: boolean = await this.profileService.isAddresseeBanned(addressee, user);
        if (isBanned)
        {
            throw new BadRequestException(errorMessage);
        }
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

    async editMessage(data: EditMessageDto, conversationMessage: ConversationMessageDocument, user: ClientUserDocument)
    {
        await conversationMessage.populate('message');

        await this.validateMessageOwnership(conversationMessage.message, user);

        const message: MessageDocument = conversationMessage.message;

        message.text = data.text;
        await message.save();

        await conversationMessage.save();

        return conversationMessage;
    }

    async removeMessage(conversationMessage: ConversationMessageDocument, user: ClientUserDocument, removeFromOthers: boolean = false)
    {
        if (removeFromOthers)
        {
            await conversationMessage.populate('message');

            const message: MessageDocument = conversationMessage.message;

            await this.validateMessageOwnership(message, user);

            await this.model.deleteMany({
                message: message._id,
            });

            await message.delete();
        }
        else
        {
            await conversationMessage.delete();
        }

        return conversationMessage;
    }

    async readLast(list: ConversationMessageListDocument, user: ClientUserDocument)
    {
        await this.messageListService.validateOwnership(list, user);

        // update all the conversation messages related to the list "messageList" which is not read yet isRead = true
        await this.model.updateMany({
            messageList: list._id,
            isRead: false
        }, {
            isRead: true
        });
    }
}