import {BadRequestException, Inject, Injectable} from "@nestjs/common";
import {UserFullnameDto} from "../dto/user-fullname.dto";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {UserAboutDto} from "../dto/user-about.dto";
import {UserInterestService} from "./user-interest.service";
import {UserInterestDto} from "../dto/user-interest.dto";
import {UserInterestDocument} from "../../core/schemas/user-interest.schema";
import {CountryDocument} from "../../core/schemas/country.schema";
import {GeoLocationDto} from "../dto/geo-location.dto";
import {BannedUser, BannedUserDocument} from "../../core/schemas/banned-user.schema";
import {ChatRouletteUserActivityService} from "./search/chat-roulette-user-activity.service";
import {ChatRouletteOfferService} from "./search/chat-roulette-offer.service";
import {UploadManagerService} from "../../core/services/upload-manager.service";
import {ImageThumbService} from "../../core/services/image-thumb.service";
import {CountryService} from "../../core/services/country.service";

@Injectable()
export class ProfileService
{
    static PROFILE_POPULATE_DEFAULT_FIELDS = [
        'residenceCountry',
        'searchCountry',
        'interests',
        'geoLocation'
    ];

    constructor(
        @InjectModel(ClientUser.name) private readonly model: Model<ClientUserDocument>,
        @InjectModel(BannedUser.name) private readonly bannedModel: Model<BannedUserDocument>,
        private readonly interestService: UserInterestService,
        private readonly chatRouletteActivityService: ChatRouletteUserActivityService,
        private readonly chatRouletteOfferService: ChatRouletteOfferService,
        private readonly uploadService: UploadManagerService,
        private readonly thumbService: ImageThumbService,
        private readonly countryService: CountryService
    ) {
    }

    getUserModel()
    {
        return this.model;
    }

    async removeAccount(user: ClientUserDocument): Promise<ClientUserDocument>
    {
        if (user.socialMediaType !== null)
        {
            throw new BadRequestException('Cannot remove this user!');
        }

        // remove chat activity
        await this.chatRouletteActivityService.remove(user);

        // remove chat offers made
        await this.chatRouletteOfferService.removeAddressedToUser(user);
        await this.chatRouletteOfferService.removeUserOffers(user);

        if (user.avatar)
        {
            try {
                await this.uploadService.removeAvatar(user);
                await this.thumbService.removeUserAvatar(user);
            }
            catch (e) {
            }
        }

        // @ts-ignore
        user.deleted = true;
        // @ts-ignore
        user.deletedAt = new Date();

        await user.save();

        return user;
    }

    async updateFullName(data: UserFullnameDto, user: ClientUserDocument): Promise<ClientUserDocument>
    {
        user.fullName = data.fullName;

        await user.save();

        return user;
    }

    async updateAbout(data: UserAboutDto, user: ClientUserDocument): Promise<ClientUserDocument>
    {
        user.about = data.about;

        await user.save();

        return user;
    }

    async addInterest({ name }: UserInterestDto, user: ClientUserDocument): Promise<UserInterestDocument>
    {
        try {
            let result: UserInterestDocument = await this.interestService.create(name);

            await this.model.updateOne(
                {
                    _id: user.id
                },
                {
                    $addToSet: {
                        interests: result.id
                    }
                });

            return result;
        }
        catch (error)
        {
            throw new BadRequestException('Cannot add this interest')
        }
    }

    async removeInterest(interest: UserInterestDocument, user: ClientUserDocument)
    {
        try {
            await this.model.updateOne({
                    _id: user.id,
                },
                {
                    $pull: {
                        interests:
                            {
                                $in: [interest.id]
                            }
                    }
                });
        }
        catch (error)
        {
            throw new BadRequestException('Cannot remove this interest')
        }
    }

    async updateLocation(user: ClientUserDocument, data: GeoLocationDto = null): Promise<ClientUserDocument>
    {
        let location: Number[] = null;
        if (data !== null)
        {
            location = [
                data.longitude,
                data.latitude
            ]
        }

        await this.model.updateOne({ _id: user.id }, {
            $set: {
                geoLocation: {
                    type: 'Point',
                    coordinates: location
                }
            }
        }
        );

        const updatedUser: ClientUserDocument = await this.model.findOne({ _id: user.id })
            .populate(ProfileService.PROFILE_POPULATE_DEFAULT_FIELDS.join(' '));

        await this.updateResidenceCountryByLocation(updatedUser);

        return updatedUser;
    }

    async updateResidenceCountryByLocation(user: ClientUserDocument)
    {
        if (!!user.geoLocation)
        {
            const [longitude, latitude] = user.geoLocation.coordinates;

            try {
                const country: CountryDocument = await this
                    .countryService
                    .getCountryByGeoLocation({
                        longitude: <number>longitude,
                        latitude: <number>latitude
                    });

                user.residenceCountry = country;
                await user.save();
            }
            catch (error)
            { }
        }
        else
        {
            user.residenceCountry = null;
            await user.save();
        }
    }

    async updateSearchCountry(country: CountryDocument, user: ClientUserDocument): Promise<ClientUserDocument>
    {
        user.searchCountry = country;

        await user.save();

        return user;
    }

    async isAddresseeBanned(user: ClientUserDocument, addressee: ClientUserDocument): Promise<boolean>
    {
        return !!await this.bannedModel.findOne({
            applicant: user,
            banned: addressee,
            isDeleted: false
        });
    }

    async validateBanStatus(user: ClientUserDocument, addressee: ClientUserDocument)
    {
        const isAddresseeBanned: boolean = await this.isAddresseeBanned(user, addressee);
        if (isAddresseeBanned)
        {
            throw new BadRequestException(`You've banned this user!`);
        }

        const isUserBanned: boolean = await this.isAddresseeBanned(addressee, user);
        if (isUserBanned)
        {
            throw new BadRequestException(`You've been banned by this user!`);
        }
    }

    async getBanStatuses(user: ClientUserDocument, addressees: ClientUserDocument[])
    {
        const statusItems = await this.bannedModel.aggregate([
            { $match: { $or: [
                        {
                            applicant: user._id,
                            banned: {
                                $in: addressees.map(addressee => addressee._id)
                            },
                            isDeleted: false
                        },
                        {
                            applicant: {
                                $in: addressees.map(addressee => addressee._id)
                            },
                            banned: user._id,
                            isDeleted: false
                        }
                ] }
            },
            { $project: { applicant: 1, banned: 1 } }
        ]);


        const result = {};

        for (let addressee of addressees)
        {
            const amIBanned = statusItems.find(item => (item.applicant.toString() === addressee.id) && (item.banned.toString() === user.id));
            const isBanned = statusItems.find(item => (item.applicant.toString() === user.id) && (item.banned.toString() === addressee.id))

            result[addressee.id] = {
                amIBanned: !!amIBanned,
                isBanned: !!isBanned
            }
        }

        return result;
    }

    async banAddressee(user: ClientUserDocument, addressee: ClientUserDocument)
    {
        await this.bannedModel.updateOne({
                applicant: user,
                banned: addressee
            },
            {
                applicant: user,
                banned: addressee,
                isDeleted: false
            },
            {
                upsert: true,
                'new': true
            });
    }

    async unbanAddressee(user: ClientUserDocument, addressee: ClientUserDocument)
    {
        await this.bannedModel.updateOne({
            applicant: user,
            banned: addressee
        },
            {
                applicant: user,
                banned: addressee,
                isDeleted: true
            },
            {
                upsert: true,
                'new': true
            });
    }

    async getById(id: string)
    {
        return this.model.findById(id);
    }
}