import {SecurityException} from "./security.exception";

export class RestorePasswordKeyExpirationException extends SecurityException
{
    constructor(
        public secondsLeft: number
    ) {
        super();
    }
}