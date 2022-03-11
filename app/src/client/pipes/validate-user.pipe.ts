import {ArgumentMetadata, BadRequestException, Injectable, PipeTransform} from "@nestjs/common";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";

@Injectable()
export class ValidateUserPipe implements PipeTransform
{
    transform(value: ClientUserDocument, metadata: ArgumentMetadata): ClientUserDocument {

        // @ts-ignore
        if (value.deleted)
        {
            throw new BadRequestException('The account was not found!');
        }

        if (value.isBlocked)
        {
            throw new BadRequestException('The account was blocked!');
        }

        return value;
    }
}