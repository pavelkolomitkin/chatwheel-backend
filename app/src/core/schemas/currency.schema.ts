import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document} from "mongoose";
import {createSerializer} from "../serializer/serializer";

export type CurrencyDocument = Currency & Document;

@Schema({
    id: true
})
export class Currency
{
    @Prop()
    name: string;

    @Prop()
    code: string;

    @Prop()
    symbol: string;
}

const CurrencySchema = SchemaFactory.createForClass(Currency);

CurrencySchema.methods.serialize = createSerializer([Currency]);

export { CurrencySchema };