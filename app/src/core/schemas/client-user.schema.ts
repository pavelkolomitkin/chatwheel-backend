import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {User, UserDocument} from './user.schema';
import {Exclude, Expose} from 'class-transformer';
import {createSerializer} from "../serializer/serializer";

export type ClientUserDocument = UserDocument & ClientUser;

@Exclude()
@Schema({
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
})
export class ClientUser
{
    @Expose({ groups: ['admin'] })
    @Prop({
        default: false
    })
    isActivated: boolean;
}

const ClientUserSchema = SchemaFactory.createForClass(ClientUser);

ClientUserSchema.virtual('roles').get(function(){
    return ['ROLE_CLIENT_USER'];
});

ClientUserSchema.methods.serialize = createSerializer([User, ClientUser]);

export { ClientUserSchema };