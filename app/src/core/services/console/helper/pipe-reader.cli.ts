import {Injectable} from "@nestjs/common";

@Injectable()
export class PipeReaderCli
{
    getContent(encoding: string = 'utf8'): Promise<string>
    {
        const stdin = process.stdin;
        stdin.setEncoding(<BufferEncoding>encoding);

        return new Promise((resolve, reject) => {

            let data = '';

            stdin.on('data', function (chunk: string) {
                data += chunk;
            });

            stdin.on('end', function () {
                resolve(data);
            });

            stdin.on('error', reject);

        });
    }
}