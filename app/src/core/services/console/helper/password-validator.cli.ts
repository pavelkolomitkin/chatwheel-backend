import {Injectable} from '@nestjs/common';
import {CoreException} from '../../../exceptions/core.exception';

@Injectable()
export class PasswordValidatorCli
{
    async validate(password: string, passwordRepeat: string, minLength: number = 6)
    {
        if (!password && (password.trim() === ''))
        {
            throw new CoreException(`The password must not be empty!`);
        }

        if (password !== passwordRepeat)
        {
            throw new CoreException(`The passwords do not match!`);
        }

        if (password.length < minLength)
        {
            throw new CoreException(`The password is shorter than ${minLength} symbols!`);
        }
    }
}