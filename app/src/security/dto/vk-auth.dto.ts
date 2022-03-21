import {IsNotEmpty, Validate} from 'class-validator';
import {SocialNetActualUserValidator} from '../validators/social-net-actual-user.validator';
import {SocialMediaType} from '../../core/schemas/client-user.schema';

export class VkAuthDto
{
    @IsNotEmpty()
    accessToken: string;

    @Validate(SocialNetActualUserValidator, [SocialMediaType.VK])
    userId: string;
}