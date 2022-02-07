import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema as MongooseSchema} from "mongoose";
import {RegionDocument} from "./region.schema";
import {CurrencyDocument} from "./currency.schema";
import {LanguageDocument} from "./language.schema";
import {createSerializer} from "../serializer/serializer";

export type CountryDocument = Country & Document;

@Schema({
    id: true
})
export class Country
{
    @Prop()
    name: string;

    @Prop()
    code: string;

    @Prop()
    capital: string

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Region',
    })
    region: RegionDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Currency',
    })
    currency: CurrencyDocument;

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

export { CountrySchema };
