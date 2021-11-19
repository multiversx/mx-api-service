import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";

const MAX_ARRAY_SIZE = 1024;

export class ParseArrayPipe implements PipeTransform<string | undefined, Promise<string | undefined>> {
    transform(value: string | undefined, _: ArgumentMetadata): Promise<string | undefined> {
        return new Promise(resolve => {
            if (value === undefined || value === '') {
                return resolve(undefined);
            }
            const valueArray = value.split(',');

            if (valueArray.length > MAX_ARRAY_SIZE) {
              throw new HttpException(`Validation failed (less than ${MAX_ARRAY_SIZE} comma separated values expected)`, HttpStatus.BAD_REQUEST);
            }
            else {
              resolve(value);
            }
        });
    }
}