import {Injectable} from "@nestjs/common";
import {CoreException} from "../../../exceptions/core.exception";
import {PasswordValidatorCli} from "./password-validator.cli";
let prompt = require('prompt');

@Injectable()
export class PasswordPromptCli
{
    constructor(
        private readonly validator: PasswordValidatorCli
    ) {
    }

    async getPassword(passwordDescription: string = 'Password(at least 6 symbols)', repeatPasswordDescription: string = 'Repeat the password')
    {
        const { password, repeatPassword } = await this.promptPassword(passwordDescription, repeatPasswordDescription);

        await this.validator.validate(password, repeatPassword);

        return password;
    }

    async promptPassword(passwordDescription: string, repeatPasswordDescription: string): Promise<{ password: string, repeatPassword: string }>
    {
        const schema = {
            properties: {
                password: {
                    hidden: true,
                    description: passwordDescription,
                    required: true
                },
                repeatPassword: {
                    hidden: true,
                    description: repeatPasswordDescription,
                    required: true
                }
            }
        };

        return new Promise((resolve, reject) => {

            prompt.get(schema, (error, result) => {

                if (error)
                {
                    throw new CoreException(error);
                }

                resolve(result);

            });

        });
    }
}