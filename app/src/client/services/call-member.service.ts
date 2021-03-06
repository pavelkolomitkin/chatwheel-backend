import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {CallMember, CallMemberDocument, CallMemberStatus} from "../../core/schemas/call-member.schema";
import {Model} from "mongoose";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {CallDocument} from "../../core/schemas/call.schema";
import {ChatRouletteUserActivityService} from "./search/chat-roulette-user-activity.service";

@Injectable()
export class CallMemberService
{
    constructor(
        @InjectModel(CallMember.name) private readonly model: Model<CallMemberDocument>,
        private readonly chatActivityService: ChatRouletteUserActivityService
    ) {
    }

    getModel()
    {
        return this.model;
    }

    async create(
        call: CallDocument,
        user: ClientUserDocument,
        isInitiator: boolean,
        status: CallMemberStatus,
        socketId: string = null
    )
    {
        const result: CallMemberDocument = new this.model({
            call: call,
            user: user,
            isInitiator: isInitiator,
            status: status,
            socketConnectionId: socketId
        });

        await result.save();

        return result;
    }

    async joinToCall(member: CallMemberDocument, socketId: string)
    {
        member.joinTime = new Date();
        member.socketConnectionId = socketId;
        member.status = CallMemberStatus.CONNECTING;
        await member.save();

        await this.chatActivityService.setUserBusyStatus(member.user, true);
    }

    async rejectCall(member: CallMemberDocument)
    {
        member.status = CallMemberStatus.REJECTED;
        await member.save();
    }

    async hangUp(member: CallMemberDocument)
    {
        member.status = CallMemberStatus.HUNG_UP;
        member.leftTime = new Date();

        await member.save();
    }

    getPendingMembers(call: CallDocument)
    {
        return this.model.find({
            call: call,
            status: CallMemberStatus.IN_PENDING
        }).populate({
            path: 'user',
            model: ClientUser.name
        });
    }

    getMembers(call: CallDocument, active: boolean = false)
    {
        let filter: Object = {
            call: call,
        };

        if (active)
        {
            filter = {
                ...filter,
                joinTime: { $ne: null },
                leftTime: { $eq: null },
            };
        }

        return this
            .model
            .find(filter)
            .populate({
                path: 'user',
                model: ClientUser.name
            })
            ;
    }

    async getMember(user: ClientUserDocument, call: CallDocument)
    {
        return this.model.findOne({
            user: user,
            call: call
        });
    }

    async getBusyMember(user: ClientUserDocument)
    {
        return this.model.findOne({
            user: user,
            status: {
                $in: [
                    CallMemberStatus.CONNECTING,
                    CallMemberStatus.CONNECTED,
                ]
            }
        });
    }

    async getSocketCallMember(user: ClientUserDocument, socketId: string)
    {
        return this.model.findOne({
            user: user,
            socketConnectionId: socketId
        });
    }

}