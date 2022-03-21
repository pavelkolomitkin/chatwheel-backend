import {BaseController} from '../../../security/controllers/base.controller';


export class StatisticBaseService extends BaseController
{
    getEndMonthTime(month: Date)
    {
        const endDay: number = (new Date(month.getFullYear(), month.getMonth() + 1, 0)).getDate();

        return new Date(month.getFullYear(), month.getMonth(), endDay, 23, 59, 59);
    }

    getStartMonthTime(month: Date)
    {
        return new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0);
    }
}