import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema as MongooseSchema} from "mongoose";
import {Region, RegionDocument} from "./region.schema";
import {CurrencyDocument} from "./currency.schema";
import {LanguageDocument} from "./language.schema";
import {createSerializer} from "../serializer/serializer";
import {Exclude, Expose, Type} from "class-transformer";
import * as autoPopulate from "mongoose-autopopulate";

export type CountryDocument = Country & Document;

@Exclude()
@Schema({
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    },
    id: true
})
export class Country
{
    @Expose({ name: 'id' })
    id: any;

    @Expose()
    @Prop()
    name: string;

    @Expose()
    @Prop()
    code: string;

    @Expose()
    @Prop()
    capital: string

    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Region',
        autopopulate: true
    })
    region: RegionDocument;

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Currency',
        autopopulate: true
    })
    currency: CurrencyDocument;

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Language',
    })
    language: LanguageDocument;

    @Prop()
    flag: string;
}

const CountrySchema = SchemaFactory.createForClass(Country);

CountrySchema.methods.serialize = createSerializer([Country]);

// @ts-ignore
CountrySchema.plugin(autoPopulate);

export { CountrySchema };
