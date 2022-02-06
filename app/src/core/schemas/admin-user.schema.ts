import {User} from "./user.schema";
import {Schema, SchemaFactory} from "@nestjs/mongoose";
import {Exclude, Expose} from "class-transformer";
import {createSerializer} from "../serializer/serializer";

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

}

const AdminUserSchema = SchemaFactory.createForClass(AdminUser);

AdminUserSchema.virtual('roles').get(function(){
    return ['ROLE_ADMIN_USER'];
});

AdminUserSchema.methods.serialize = createSerializer([User, AdminUser]);

export { AdminUserSchema };