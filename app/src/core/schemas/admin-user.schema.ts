import {ROLE_ADMIN_USER, ROLE_SUPER_ADMIN_USER, User} from "./user.schema";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Exclude, Expose} from "class-transformer";
import {createSerializer} from "../serializer/serializer";
import {Schema as MongooseSchema} from "mongoose";

export type AdminUserDocument = User & AdminUser

@Exclude()
@Schema({
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
})
export class AdminUser
{
    @Prop({
        type: MongooseSchema.Types.Boolean,
        required: false,
        default: false
    })
    isSuperAdmin: boolean;
}

const AdminUserSchema = SchemaFactory.createForClass(AdminUser);

AdminUserSchema.virtual('roles').get(function(){

    const result = [ROLE_ADMIN_USER];

    if (this.isSuperAdmin)
    {
        result.push(ROLE_SUPER_ADMIN_USER);
    }

    return result;
});

AdminUserSchema.methods.serialize = createSerializer([User, AdminUser]);

export { AdminUserSchema };