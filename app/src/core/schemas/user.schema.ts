import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {ClientUser} from './client-user.schema';
import {AdminUser} from './admin-user.schema';
import {Exclude, Expose} from 'class-transformer';
import {createSerializer} from '../serializer/serializer';
import {BaseSchema} from './base.schema';
import * as mongooseDelete from 'mongoose-delete';
import {aggregate} from '../middlewares/soft-delete-entity.middleware';
import config from '../config/index';

export type UserDocument = Document & User;

export const ROLE_USER = 'ROLE_USER';
export const ROLE_CLIENT_USER = 'ROLE_CLIENT_USER';
export const ROLE_ADMIN_USER = 'ROLE_ADMIN_USER';

@Exclude()
@Schema({
    timestamps: true,
    discriminatorKey: 'kind',
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    },
    id: true
})
export class User extends BaseSchema {

    @Prop({
        type: MongooseSchema.Types.String,
        required: true,
        enum: ['ClientUser', 'AdminUser'],
    })
    kind: string;

    @Expose({ groups: ['mine', 'admin'] })
    @Prop({
        required: false,
        unique: false,
        default: null,
    })
    email: string;

    @Prop({
        required: false,
        default: null
    })
    password: string;

    @Expose()
    @Prop({
        required: true,
        maxlength: 255
    })
    fullName: string;

    @Expose()
    roles: string;

    @Expose()
    @Prop({
        type: {},
        default: null
    })
    avatar: {};

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Date,
    })
    lastActivity: Date;

    @Expose()
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
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('roles').get(function(){
    return [ROLE_USER];
});

UserSchema.methods.setAvatar = function(file = null) {

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
};
UserSchema.methods.serialize = createSerializer([User],
    (data: any) => {
        if (!data.avatar)
        {
            return;
        }

        const avatarThumbs: any = config().thumbs.avatar;
        const avatarThumbProvider = config().getAvatarThumb;

        data.avatarThumbs = {};

        const id: string = data.id.toString();
        const fileName = data.avatar.filename;

        for (const size of Object.keys(avatarThumbs))
        {
            data.avatarThumbs[size] = avatarThumbProvider(id, fileName, size);
        }
    });

UserSchema.plugin(mongooseDelete, { deletedAt : true, overrideMethods: 'all' });
UserSchema.pre('aggregate', aggregate);

export {UserSchema};