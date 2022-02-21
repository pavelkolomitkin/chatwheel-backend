import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class DateTimePipe implements PipeTransform
{
    transform(value: string, metadata: ArgumentMetadata): Date {

        if (!value)
        {
            return null;
        }

        if (typeof value === 'object')
        {
            // @ts-ignore
            if (value.constructor === Date)
            {
                return value;
            }
        }

        const momentValue = moment(value);
        if (momentValue.isValid())
        {
            return momentValue.toDate()
        }

        return null;
    }

}
