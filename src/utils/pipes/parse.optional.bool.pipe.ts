import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";

export class ParseOptionalBoolPipe implements PipeTransform<string | boolean, Promise<boolean | undefined>> {
    transform(value: string | boolean, _: ArgumentMetadata): Promise<boolean | undefined> {
        return new Promise(resolve => {
            if (value === true || value === 'true') {
                return resolve(true);
            }

            if (value === false || value === 'false') {
                return resolve(false);
            }

            if (value === null || value === undefined || value === '') {
                return resolve(undefined);
            }

            // throw this.exceptionFactory('Validation failed (optional boolean string is expected)');
            throw new HttpException('Validation failed (optional boolean string is expected)', HttpStatus.BAD_REQUEST);
        });
    }
}
