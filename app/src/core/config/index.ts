const fs = require('fs');
import { config as thumbs } from './thumbs';

export default () => {

    const APP_SECRET: string = fs.readFileSync(process.env.APP_SECRET_FILE);
    const EMAIL_SENDER_API_KEY: string = fs.readFileSync(process.env.EMAIL_SENDER_API_KEY_FILE);
    const MONGO_INITDB_ROOT_USERNAME: string = fs.readFileSync(process.env.MONGO_INITDB_ROOT_USERNAME_FILE);
    const MONGO_INITDB_ROOT_PASSWORD: string = fs.readFileSync(process.env.MONGO_INITDB_ROOT_PASSWORD_FILE);
    const FACEBOOK_APP_ID: string = fs.readFileSync(process.env.FACEBOOK_APP_ID_FILE);
    const FACEBOOK_APP_SECRET: string = fs.readFileSync(process.env.FACEBOOK_APP_SECRET_FILE);

    return {
        APP_SECRET: APP_SECRET.toString(),
        EMAIL_SENDER_API_KEY: EMAIL_SENDER_API_KEY.toString(),
        MONGO_INITDB_ROOT_USERNAME: MONGO_INITDB_ROOT_USERNAME.toString(),
        MONGO_INITDB_ROOT_PASSWORD: MONGO_INITDB_ROOT_PASSWORD.toString(),
        FACEBOOK_APP_ID: FACEBOOK_APP_ID.toString(),
        FACEBOOK_APP_SECRET: FACEBOOK_APP_SECRET.toString(),
        thumbs: thumbs,
        getAvatarThumb: (userId, fileName, size) => {
            return '/core/user/avatar/' + userId + '/' + fileName + '/' + size;
        }
    };

}