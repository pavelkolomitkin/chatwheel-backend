import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {User, UserSchema} from './user.schema';

export type ClientUserDocument = User & ClientUser;

@Schema()
export class ClientUser
{
    @Prop({
        default: false
    })
    isActivated: boolean;

    getRoles(): string[] {
        return ['CLIENT_ROLE'];
    }
}

const ClientUserSchema = SchemaFactory.createForClass(ClientUser);

export { ClientUserSchema };