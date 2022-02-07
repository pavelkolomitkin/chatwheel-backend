import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {createSerializer} from "../serializer/serializer";
import {Document} from "mongoose";

export type LanguageDocument = Language & Document;

@Schema({
    id: true
})
export class Language
{
    @Prop()
    name: string;

    @Prop()
    code: string;
}

const LanguageSchema = SchemaFactory.createForClass(Language);

LanguageSchema.methods.serialize = createSerializer([Language]);

export {LanguageSchema};