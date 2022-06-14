import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";


export class ParseArrayPipe implements PipeTransform<string | undefined, Promise<string[] | undefined>> {
  private readonly maxArraySize;

  constructor(maxArraySize: number = 1024) {
    this.maxArraySize = maxArraySize;
  }

  transform(value: string | undefined, _: ArgumentMetadata): Promise<string[] | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const valueArray = value.split(',');

      if (valueArray.length > this.maxArraySize) {
        throw new HttpException(`Validation failed (less than ${this.maxArraySize} comma separated values expected)`, HttpStatus.BAD_REQUEST);
      }

      const distinctValueArray = valueArray.distinct();

      resolve(distinctValueArray);
    });
  }
}
