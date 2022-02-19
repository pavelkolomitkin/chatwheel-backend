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
import {REQUEST} from "@nestjs/core";
import { Request } from 'express';
import {BannedUser, BannedUserDocument} from "../../core/schemas/banned-user.schema";


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
        @Inject(REQUEST) private readonly request: Request
    ) {
    }

    getCurrentUser(): ClientUserDocument
    {
        // @ts-ignore
        return this.request.user;
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

        return updatedUser;
    }

    async updateResidenceCountry(country: CountryDocument, user: ClientUserDocument): Promise<ClientUserDocument>
    {
        //debugger
        user.residenceCountry = country;

        await user.save();

        return user;
    }

    async updateSearchCountry(country: CountryDocument, user: ClientUserDocument): Promise<ClientUserDocument>
    {
        user.searchCountry = country;

        await user.save();

        return user;
    }

    async removeAccount(user: ClientUserDocument): Promise<ClientUserDocument>
    {
        await user.delete();

        return user;
    }

    async isAddresseeBanned(user: ClientUserDocument, addressee: ClientUserDocument): Promise<boolean>
    {
        return !!await this.bannedModel.findOne({
            applicant: user,
            banned: addressee
        });
    }
}