import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";

export class ParseOptionalEnumArrayPipe<T extends { [name: string]: any }> implements PipeTransform<string | undefined, Promise<string[] | undefined>> {
  constructor(private readonly type: T) { }

  transform(value: string | undefined, _: ArgumentMetadata): Promise<string[] | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const values = value.split(',');

      const expectedValues = this.getValues(this.type);
      for (const value of values) {
        if (!expectedValues.includes(value)) {
          throw new HttpException(`Validation failed (one of the following values is expected: ${expectedValues.join(', ')})`, HttpStatus.BAD_REQUEST);
        }
      }

      return resolve(values);
    });
  }


  private getValues<T extends { [name: string]: any }>(value: T): string[] {
    return Object.keys(value).map(key => value[key]).filter(value => typeof value === 'string') as string[];
  }
}
