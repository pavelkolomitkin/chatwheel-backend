import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document} from "mongoose";
import {createSerializer} from "../serializer/serializer";

export type RegionDocument = Region & Document;

@Schema({
    id: true
})
export class Region
{
    @Prop()
    name: string;

    @Prop()
    code: string;
}

const RegionSchema = SchemaFactory.createForClass(Region);

RegionSchema.methods.serialize = createSerializer([Region])

export { RegionSchema };