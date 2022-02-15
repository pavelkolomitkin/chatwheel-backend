import { config as thumbs } from './thumbs';

export default () => (
    {
        thumbs: thumbs,
        getAvatarThumb: (userId, fileName, size) => {
            return '/core/user/avatar/' + userId + '/' + fileName + '/' + size;
        }
    }
);