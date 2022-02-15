import {Provider} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import * as mongoose from 'mongoose';

export const provider: Provider = {

    provide: 'DATABASE_CONNECTION',

    inject: [ConfigService],

    useFactory: async (config: ConfigService) => {

        const connectionUri = 'mongodb://mongodb-service:'
            + config.get('MONGO_DATABASE_PORT')
            + '/' + config.get('MONGO_INITDB_DATABASE');

        const connectionOptions = {
            autoIndex: false
        };

        await mongoose.connect(connectionUri, connectionOptions);
        console.log('Connection established ' + connectionUri);


        mongoose.set('toJSON', { virtuals: true });
        mongoose.set('toObject', { virtuals: true });

        return mongoose;
    }
}