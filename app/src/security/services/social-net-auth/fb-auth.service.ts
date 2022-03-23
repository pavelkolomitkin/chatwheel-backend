import {BadRequestException, Injectable} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {InjectModel} from '@nestjs/mongoose';
import {ClientUser, ClientUserDocument, SocialMediaType} from '../../../core/schemas/client-user.schema';
import {Model} from 'mongoose';
import {SecurityTokenService} from '../security-token.service';
import {FbAuthDto} from '../../dto/fb-auth.dto';
import {ConfigService} from '@nestjs/config';
import {SocialNetActualUserValidator} from '../../validators/social-net-actual-user.validator';

@Injectable()
export class FbAuthService
{
    static INVALID_TOKEN_ERROR_MESSAGE = 'Invalid token!';

    constructor(
        private readonly http: HttpService,
        @InjectModel(ClientUser.name) private readonly model: Model<ClientUserDocument>,
        private readonly tokenService: SecurityTokenService,
        private readonly config: ConfigService,
        private readonly userValidator: SocialNetActualUserValidator
    ) {
    }

    async auth(data: FbAuthDto): Promise<string | null>
    {
        debugger
        const { accessToken, code } = data;

        // get the public profile info by the accessToken
        const userData: any = await this.getUserData(accessToken);
        const {
            id,
            first_name,
            name,
            last_name,
            picture
        } = userData;

        await this.validateUserId(id.toString());

        // find a user with social media type = FB and id = received id
        let user: ClientUserDocument = await this.model.findOne({
            socialMediaUserId: id.toString(),
            socialMediaType: SocialMediaType.FB,
        })

        const socialMediaPhotos = {};
        if (picture)
        {
            socialMediaPhotos['photo_50'] = picture.data.url;
        }

        // if there is no one
        if (!user)
        {
            // create a new user with received data(including user's pictures)
            user = new this.model({
                fullName: name,
                socialMediaType: SocialMediaType.FB,
                socialMediaUserId: id.toString(),
                socialMediaPhotos: socialMediaPhotos,
                isActivated: true
            });

            user = await this.model.findOneAndUpdate(
                {
                    socialMediaType: SocialMediaType.FB,
                    socialMediaUserId: id.toString(),
                },
                user,
                {
                    new: true,
                    upsert: true
                }
            );
        }
        // else
        else
        {
            // create a new one
            user.socialMediaPhotos = socialMediaPhotos;
            await user.save();
        }

        // create a new jwt token for the user
        const result: string = this.tokenService.getUserToken(user);

        // return the token
        return result;
    }

    async validateUserId(socialUserId: string)
    {
        const isValid: boolean = await this.userValidator.validate(socialUserId.toString(), {
            constraints: [SocialMediaType.FB],
            object: undefined,
            property: '',
            targetName: '',
            value: undefined,
        });
        if (!isValid)
        {
            throw new BadRequestException('The user is not found')
        }
    }

    async getUserData(userAccessToken: string)
    {
        const url: string = this.getProfileDataUrl(userAccessToken);
        debugger
        try {

            const data: any = await this.http.get(url).toPromise();
            debugger
            const result: any = data.data.response.data;

            if (typeof result.error !== 'undefined')
            {
                throw new BadRequestException(FbAuthService.INVALID_TOKEN_ERROR_MESSAGE);
            }

            return result;
        }
        catch (error)
        {
            debugger
            throw new BadRequestException(FbAuthService.INVALID_TOKEN_ERROR_MESSAGE);
        }
    }

    getProfileDataUrl(userAccessToken: string)
    {
        return `https://graph.facebook.com/v13.0/me?fields=id,first_name,name,last_name,picture&access_token=${userAccessToken}`;
    }
}