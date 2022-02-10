import config from "../../../config";


export const userAvatarThumbsHook = (data: any) => {

    if (!data.avatar)
    {
        return;
    }

    const avatarThumbs: any = config().thumbs.avatar;
    const avatarThumbProvider = config().getAvatarThumb;

    data.avatarThumbs = {};

    const id: string = data.id.toString();
    const fileName = data.avatar.filename;

    debugger
    for (const size of Object.keys(avatarThumbs))
    {
        data.avatarThumbs[size] = avatarThumbProvider(id, fileName, size);
    }
};