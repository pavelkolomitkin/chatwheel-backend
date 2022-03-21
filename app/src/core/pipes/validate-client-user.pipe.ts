import {ArgumentMetadata, BadRequestException, Injectable, PipeTransform} from "@nestjs/common";
import {ClientUserDocument} from "../schemas/client-user.schema";

@Injectable()
export class ValidateClientUserPipe implements PipeTransform
{
    transform(value: ClientUserDocument, metadata: ArgumentMetadata): any {

        if (!value.isActivated)
        {
            throw new BadRequestException('The account is not activated!');
        }

        return value;
    }
}