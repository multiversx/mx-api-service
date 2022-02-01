import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";

export class ParseOptionalEnumPipe<T extends { [name: string]: any }> implements PipeTransform<string | undefined, Promise<string | undefined>> {
  constructor(private readonly type: T) { }

  transform(value: string | undefined, _: ArgumentMetadata): Promise<string | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      const values = this.getValues(this.type);
      if (values.includes(value)) {
        return resolve(value);
      }

      throw new HttpException(`Validation failed (one of the following values is expected: ${values.join(', ')})`, HttpStatus.BAD_REQUEST);
    });
  }


  private getValues<T extends { [name: string]: any }>(value: T): string[] {
    return Object.keys(value).map(key => value[key]).filter(value => typeof value === 'string') as string[];
  }
}
