import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from 'class-validator';
import {Injectable} from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'UserPasswordsEqualValidator'})
export class UserPasswordsEqualValidator implements ValidatorConstraintInterface
{
    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'Passwords should be equal!';
    }

    validate(value: string, validationArguments?: ValidationArguments): Promise<boolean> | boolean {

        return value === validationArguments.object['passwordRepeat'];

    }
}
