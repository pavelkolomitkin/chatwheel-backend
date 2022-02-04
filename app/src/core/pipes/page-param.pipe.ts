import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';

@Injectable()
export class PageParamPipe implements PipeTransform
{
    async transform(value: string, metadata: ArgumentMetadata): Promise<number> {

        let result = parseInt(value);

        if (isNaN(result) || (result < 1))
        {
            result = 1
        }

        return result;
    }
}
