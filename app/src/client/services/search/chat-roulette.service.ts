import {BadRequestException, Injectable} from "@nestjs/common";
import {
    ChatRouletteUserActivity,
    ChatRouletteUserActivityDocument
} from "../../../core/schemas/chat-roulette-user-activity.schema";
import {ClientUser, ClientUserDocument} from "../../../core/schemas/client-user.schema";
import {ChatRouletteUserActivityService} from "./chat-roulette-user-activity.service";
import {ChatRouletteOfferService} from "./chat-roulette-offer.service";
import {ChatRouletteOfferDocument} from "../../../core/schemas/chat-roulette-offer.schema";
import {InjectModel} from "@nestjs/mongoose";
import {ProfileService} from "../profile.service";
import {ChatRoulettePictureService} from "./chat-roulette-picture.service";

@Injectable()
export class ChatRouletteService
{
    constructor(
        private readonly profileService: ProfileService,
        private readonly offerService: ChatRouletteOfferService,
        private readonly activityService: ChatRouletteUserActivityService,
        private readonly pictureService: ChatRoulettePictureService
    ) {
    }


    async turnOn(user: ClientUserDocument, latestChatPicture: File)
    {
        let activity: ChatRouletteUserActivityDocument = await this.activityService.get(user);
        if (!activity)
        {
            activity = await this.activityService.create(user);
        }

        if (!!activity.lastCapturedPicture)
        {
            try {
                await this.pictureService.removePicture(activity);
            }
            catch (error) { }
        }

        // @ts-ignore
        activity.setPicture(latestChatPicture);
        activity.isBusy = false;

        await activity.save();

        return activity;
    }

    async turnOff(user: ClientUserDocument)
    {
        await this.activityService.remove(user);
    }

    async findAddressedOffer(user: ClientUserDocument): Promise<ChatRouletteOfferDocument>
    {
        const result: ChatRouletteOfferDocument = await this.offerService.getActualOffer(user);

        if (!result)
        {
            return null;
        }

        await result.populate('user');

        return result;
    }

    async findPartner(user: ClientUserDocument, withPreferences: boolean = false): Promise<ChatRouletteOfferDocument>
    {
        // TODO create a unique index for the field 'chatrouletteoffers.user' in order to avoid multiplying offers from the same user

        // find the previous offer made by user to anyone
            // if it exists
                // remove it keeping the addressee link in order to rule out them from the next offer that is gonna be made

        const previousOffer: ChatRouletteOfferDocument = await this.offerService.getUserOffer(user);
        if (previousOffer)
        {
            // TODO you should use the addressee in order to rule out them from the next candidate
            await previousOffer.delete();
        }

        // TODO the parameter "withPreferences" should be considered as well
        const searchResult = await this.activityService.getModel().aggregate([
            {
                $match: {
                    isBusy: false,
                    user: {
                        $ne: user._id
                    }
                }
            },
            {
                $lookup: {
                    from: 'bannedusers',
                    let: { user: '$user' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: [ '$applicant', '$$user' ], },
                                                { $eq: [ '$banned', user._id] },
                                                { $eq: [ '$isDeleted', false] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: [ '$applicant', user._id ], },
                                                { $eq: [ '$banned', '$$user' ] },
                                                { $eq: [ '$isDeleted', false] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'banStatus'
                }
            },
            {
                $match: {
                    'banStatus': {
                        $size: 0
                    }
                }
            },
            {
                $sample: { size: 1 }
            },
            {
                $project: { _id: 1, user: 1, lastCapturedPicture: 1 }
            }
        ]);

        if (searchResult.length === 0)
        {
            return null;
        }

        const resultItem = searchResult[0];
        const partner: ClientUserDocument = await this.profileService.getById(resultItem.user._id.toString());

        const result: ChatRouletteOfferDocument = await this.offerService.create(user, partner);
        await result.populate('addressee');

        return result;
    }

    async acceptOffer(offer: ChatRouletteOfferDocument, addressee: ClientUserDocument)
    {
        // validate relationship
        await this.offerService.validateRelationship(offer, addressee);

        // update accepted = true
        offer.accepted = true;
        await offer.save();

        return offer;
    }
}