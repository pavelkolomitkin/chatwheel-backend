import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document} from "mongoose";
import {createSerializer} from "../serializer/serializer";
import {Exclude, Expose, Type} from "class-transformer";
import * as Mongoose from "mongoose";

export type RegionDocument = Region & Document;

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
export class Region
{
    @Expose({ name: 'id' })
    id: any;

    @Expose()
    @Prop()
    name: string;

    @Expose()
    @Prop()
    code: string;
}

const RegionSchema = SchemaFactory.createForClass(Region);

RegionSchema.methods.serialize = createSerializer([Region])

export { RegionSchema };