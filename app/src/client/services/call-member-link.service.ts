import {BadRequestException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {CallMemberLink, CallMemberLinkDocument, CallMemberLinkStatus} from "../../core/schemas/call-member-link.schema";
import {Model} from "mongoose";
import {CallDocument} from "../../core/schemas/call.schema";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";

@Injectable()
export class CallMemberLinkService
{
    constructor(
        @InjectModel(CallMemberLink.name) private readonly model: Model<CallMemberLinkDocument>
    ) {
    }

    getModel()
    {
        return this.model;
    }

    async initiate(call: CallDocument, user: ClientUserDocument, addressee: ClientUserDocument, peerId: string)
    {
        const result: CallMemberLinkDocument = new this.model({
            call: call,
            initiator: user,
            addressee: addressee,
            initiatorPeer: peerId,
            status: CallMemberLinkStatus.CONNECTING
        });

        await result.save();

        return result;
    }

    async reject(call: CallDocument, user: ClientUserDocument, addressee: ClientUserDocument)
    {
        const result: CallMemberLinkDocument = new this.model({
            call: call,
            initiator: user,
            addressee: addressee,
            status: CallMemberLinkStatus.REJECTED
        });

        await result.save();

        return result;
    }

    async createHangUp(call: CallDocument, user: ClientUserDocument, addressee: ClientUserDocument)
    {
        const result: CallMemberLinkDocument = new this.model({
            call: call,
            initiator: user,
            addressee: addressee,
            status: CallMemberLinkStatus.HUNG_UP
        });

        await result.save();

        return result;
    }

    async hangUp(call: CallDocument, user: ClientUserDocument)
    {
        await this.model.updateMany({
            $and: [
                { call: call },
                {
                    $or: [
                        { initiator: user },
                        { addressee: user }
                    ],
                }
            ]
        },
        {
            $set: {
                status: CallMemberLinkStatus.HUNG_UP
            }
        });
    }


    async validateAddressee(user: ClientUserDocument, link: CallMemberLinkDocument)
    {
        await link.populate({
            path: 'addressee',
            model: ClientUser.name
        });

        if (link.addressee.id !== user.id)
        {
            throw new BadRequestException('The connection is not found!');
        }
    }

    async getUserInitiateLinkNumber(user: ClientUserDocument, call: CallDocument, statuses: CallMemberLinkStatus[] = null)
    {
        let filter: any = {
            call: call,
            initiator: user
        };

        if (statuses !== null)
        {
            filter = {
                ...filter,
                status: {
                    $in: statuses
                }
            };
        }

        return this.model.find(filter).count();
    }
}