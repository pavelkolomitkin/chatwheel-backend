import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ROLE_CLIENT_USER, User, UserDocument} from './user.schema';
import {Exclude, Expose, Type} from 'class-transformer';
import {createSerializer} from "../serializer/serializer";
import {Schema as MongooseSchema} from "mongoose";
import {Country, CountryDocument, CountrySchema} from "./country.schema";
import {UserInterest, UserInterestDocument} from "./user-interest.schema";
import {GeoPointDocument, GeoPointSchema} from "./geo/geo-point.schema";
import {userAvatarThumbsHook} from "../models/serialization/hooks/user.hooks";

export type ClientUserDocument = UserDocument & ClientUser;

export enum SocialMediaType {
    VK = 0,
    FB = 1,
    GOOGLE = 2
}

@Exclude()
@Schema({
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
})
export class ClientUser
{
    static COMMON_POPULATED_FIELDS = [
        'residenceCountry',
        'searchCountry',
        'interests',
        'geoLocation'
    ];

    @Expose({ groups: ['admin'] })
    @Prop({
        default: false,
    })
    isActivated: boolean;

    @Type(() => Country)
    @Expose({ groups:  ['mine', 'admin', 'details'] })
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Country',
        required: false,
        default: null,
        autopopulate: true
    })
    residenceCountry: CountryDocument;

    @Expose({ groups:  ['mine', 'admin'] })
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Country',
        required: false,
        default: null,
        autopopulate: true
    })
    searchCountry: CountryDocument;

    @Expose()
    @Prop({
        type: GeoPointSchema,
        required: false,
    })
    geoLocation: GeoPointDocument;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.String,
        required: false,
        maxlength: 1000
    })
    about: string;

    @Type(() => UserInterest)
    @Expose()
    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'UserInterest' }],
    })
    interests: UserInterestDocument[];

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Number,
        required: false,
        default: null
    })
    socialMediaType: SocialMediaType;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.String,
        required: false,
        default: null
    })
    socialMediaUserId: string;

    @Expose()
    @Prop({
        type: {},
        required: false,
        default: null
    })
    socialMediaPhotos: {};
}

const ClientUserSchema = SchemaFactory.createForClass(ClientUser);

ClientUserSchema.virtual('roles').get(function(){
    return [ROLE_CLIENT_USER];
});

ClientUserSchema.methods.populateCommonFields = async function()
{
    await this.populate(ClientUser.COMMON_POPULATED_FIELDS.join(' '));
}

ClientUserSchema.methods.serialize = createSerializer([User, ClientUser], userAvatarThumbsHook);
// @ts-ignore
ClientUserSchema.plugin(require('mongoose-autopopulate'));

export { ClientUserSchema };