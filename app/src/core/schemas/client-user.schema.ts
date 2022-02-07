import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {User, UserDocument} from './user.schema';
import {Exclude, Expose} from 'class-transformer';
import {createSerializer} from "../serializer/serializer";
import {Schema as MongooseSchema} from "mongoose";
import {CountryDocument} from "./country.schema";
import {UserInterestDocument} from "./user-interest.schema";
import {GeoPointDocument, GeoPointSchema} from "./geo/geo-point.schema";

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

    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Country',
        required: false,
        default: null
    })
    residenceCountry: CountryDocument;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Country',
        required: false,
        default: null
    })
    searchCountry: CountryDocument;

    @Expose()
    @Prop({
        type: GeoPointSchema,
        required: false,
        //index: '2dsphere' // TODO move this to a migration
    })
    geoLocation: GeoPointDocument;

    @Expose()
    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'UserInterest' }],
    })
    interests: UserInterestDocument[];
}

const ClientUserSchema = SchemaFactory.createForClass(ClientUser);

ClientUserSchema.virtual('roles').get(function(){
    return ['ROLE_CLIENT_USER'];
});

ClientUserSchema.methods.serialize = createSerializer([User, ClientUser]);

export { ClientUserSchema };