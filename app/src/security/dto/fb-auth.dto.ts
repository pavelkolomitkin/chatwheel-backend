import {IsNotEmpty} from 'class-validator';

export class FbAuthDto
{
    @IsNotEmpty()
    accessToken: string;

    @IsNotEmpty()
    code: string;
}