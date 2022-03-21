import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from "class-validator";
import {Injectable} from "@nestjs/common";
import {RestorePasswordKeyService} from "../services/restore-password-key.service";

@Injectable()
export class RestorePasswordKeyValidator implements ValidatorConstraintInterface
{
    constructor(private readonly service: RestorePasswordKeyService) {
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'The key is invalid!';
    }

    async validate(value: string, validationArguments?: ValidationArguments): Promise<boolean> {

        return await this.service.isKeyValid(value);
    }

}