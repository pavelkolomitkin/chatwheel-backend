import {ArgumentMetadata, BadRequestException, Injectable, PipeTransform} from "@nestjs/common";
import {ROLE_CLIENT_USER, UserDocument} from "../schemas/user.schema";
import {ClientUserDocument} from "../schemas/client-user.schema";

@Injectable()
export class ValidateUserPipe implements PipeTransform
{
    transform(value: UserDocument, metadata: ArgumentMetadata): UserDocument {

        // @ts-ignore
        if (value.deleted)
        {
            throw new BadRequestException('The account was not found!');
        }

        if (value.isBlocked)
        {
            throw new BadRequestException('The account was blocked!');
        }

        if (value.roles.includes(ROLE_CLIENT_USER))
        {
            if (!(<ClientUserDocument>value).isActivated)
            {
                throw new BadRequestException('The account is not activated!');
            }
        }

        return value;
    }
}