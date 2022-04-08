import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {BaseSchema} from "./base.schema";
import {createSerializer} from "../serializer/serializer";
import {Exclude, Expose} from "class-transformer";
import {Document} from "mongoose";

export type UserInterestDocument = UserInterest & Document;

@Exclude()
@Schema({
    timestamps: true,
    id: true,
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    },
})
export class UserInterest extends BaseSchema
{
    @Expose()
    @Prop()
    name: string;
}

const UserInterestSchema = SchemaFactory.createForClass(UserInterest);

UserInterestSchema.methods.serialize = createSerializer([UserInterest]);

export { UserInterestSchema };