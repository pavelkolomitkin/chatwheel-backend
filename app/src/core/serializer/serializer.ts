import {plainToClass, plainToInstance} from 'class-transformer';

const serialize = function(modelClass, groups: string[] = []) {

    const plainObject = this.toObject();

    //const result = plainToClass(modelClass, plainObject, { groups: groups });
    const result = plainToInstance(modelClass, plainObject, { groups: groups });
    return result
};

export const createSerializer = (modelClasses: any[], afterSerializeHook: Function = null) => {
    return function (groups: string[] = []) {

        //debugger
        //const classes = [BaseEntityModel, ...modelClasses ];
        const classes = modelClasses;

        let result = {};
        for (let modelClass of classes)
        {
            result = { ...result, ...serialize.call(this, modelClass, groups) };
        }


        if (afterSerializeHook)
        {
            afterSerializeHook(result);
        }

        return result;
    }
};