import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";

export class ParseOptionalIntPipe implements PipeTransform<string | undefined, Promise<number | undefined>> {
    transform(value: string | undefined, _: ArgumentMetadata): Promise<number | undefined> {
        return new Promise(resolve => {
            if (value === undefined || value === '') {
                return resolve(undefined);
            }

            if (!isNaN(Number(value))) {
                return resolve(Number(value));
            }

            throw new HttpException('Validation failed (optional number is expected)', HttpStatus.BAD_REQUEST);
        });
    }
}
