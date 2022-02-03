import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from 'mongoose';
import {ClientUser} from "./client-user.schema";
import {AdminUser} from "./admin-user.schema";


@Schema({
    timestamps: true,
    discriminatorKey: 'kind'
})
export class User extends Document {

    @Prop({
        type: MongooseSchema.Types.String,
        required: true,
        enum: ['ClientUser', 'AdminUser']
    })
    kind: string;

    @Prop({
        required: false,
        unique: false,
        default: null
    })
    email: string;

    @Prop({
        required: false,
        default: null
    })
    password: string;

    @Prop({
        required: true,
        maxlength: 255
    })
    fullName: string;

    @Prop({
        type: {},
        default: null
    })
    avatar: {};
    
    @Prop({
        type: MongooseSchema.Types.Date,
    })
    lastActivity: Date;

    @Prop({
        type: MongooseSchema.Types.Boolean,
        default: false
    })
    isBlocked: boolean;

    @Prop({
        type: MongooseSchema.Types.String,
        default: null,
        required: false
    })
    blockingReason: string;

    getRoles(): string[]
    {
        return ['USER_ROLE'];
    }

    setAvatar(file = null) {

        if (!file)
        {
            this.avatar = null;
            return;
        }

        this.avatar = {
            encoding: file.encoding,
            mimetype: file.mimetype,
            originalname: file.originalname,
            size: file.size,
            filename: file.filename
        };
    }
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('roles').get(function(){
    return this.getRoles();
});

export {UserSchema};