import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";


export class ParseArrayPipe implements PipeTransform<string | undefined, Promise<string[] | undefined>> {
  private MAX_ARRAY_SIZE = 1024;

  transform(value: string | undefined, _: ArgumentMetadata): Promise<string[] | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const valueArray = value.split(',');

      if (valueArray.length > this.MAX_ARRAY_SIZE) {
        throw new HttpException(`Validation failed (less than ${this.MAX_ARRAY_SIZE} comma separated values expected)`, HttpStatus.BAD_REQUEST);
      }

      resolve(valueArray);
    });
  }
}