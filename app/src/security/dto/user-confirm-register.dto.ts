import {Validate} from 'class-validator';
import {UserRegisterConfirmationKeyValidator} from '../validators/user-register-confirmation-key.validator';
import {Transform} from 'class-transformer';

export class UserConfirmRegisterDto
{
    @Transform(({value}) => value.trim())
    @Validate(UserRegisterConfirmationKeyValidator)
    public key: string;
}
