import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ROLE_CLIENT_USER, User, UserDocument} from './user.schema';
import {Exclude, Expose, Type} from 'class-transformer';
import {createSerializer} from "../serializer/serializer";
import {Schema as MongooseSchema} from "mongoose";
import {Country, CountryDocument, CountrySchema} from "./country.schema";
import {UserInterestDocument} from "./user-interest.schema";
import {GeoPointDocument, GeoPointSchema} from "./geo/geo-point.schema";
import * as autoPopulate from "mongoose-autopopulate";

export type ClientUserDocument = UserDocument & ClientUser;

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
    @Expose({ groups: ['admin'] })
    @Prop({
        default: false,
    })
    isActivated: boolean;

    @Type(() => Country)
    @Expose({ groups:  ['mine', 'admin'] })
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

    @Expose()
    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'UserInterest' }],
    })
    interests: UserInterestDocument[];
}

const ClientUserSchema = SchemaFactory.createForClass(ClientUser);

ClientUserSchema.virtual('roles').get(function(){
    return [ROLE_CLIENT_USER];
});

ClientUserSchema.methods.serialize = createSerializer([User, ClientUser]);
// @ts-ignore
ClientUserSchema.plugin(autoPopulate);

export { ClientUserSchema };