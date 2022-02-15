import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class DateTimePipe implements PipeTransform
{
    transform(value: string, metadata: ArgumentMetadata): Date {

        if (!value || (typeof value === 'object'))
        {
            return null;
        }
        const momentValue = moment(value);
        if (momentValue.isValid())
        {
            return momentValue.toDate()
        }

        return null;
    }

}
