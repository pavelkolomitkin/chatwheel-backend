import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {createSerializer} from "../serializer/serializer";
import {Document} from "mongoose";
import {Expose} from "class-transformer";

export type LanguageDocument = Language & Document;

@Schema({
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    },
    id: true
})
export class Language
{
    @Expose({ name: 'id' })
    id: any;
    
    @Prop()
    name: string;

    @Prop()
    code: string;
}

const LanguageSchema = SchemaFactory.createForClass(Language);

LanguageSchema.methods.serialize = createSerializer([Language]);

export {LanguageSchema};