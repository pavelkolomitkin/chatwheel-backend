import {User} from "./user.schema";
import {Schema, SchemaFactory} from "@nestjs/mongoose";

export type AdminUserDocument = User & AdminUser

@Schema()
export class AdminUser
{
    getRoles(): string[]
    {
        return ['ADMIN_ROLE'];
    }
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);