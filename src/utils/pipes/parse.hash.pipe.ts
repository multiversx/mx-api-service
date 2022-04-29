import { Hash } from "@elrondnetwork/erdjs/out/hash";
import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";

export class ParseHashPipe implements PipeTransform<string | string[] | undefined, Promise<string | string[] | undefined>> {
  private entity: string;
  private length: number;
  constructor(entity: string, length: number) {
    this.entity = entity;
    this.length = length;
  }

  transform(value: string | string[] | undefined, metadata: ArgumentMetadata): Promise<string | string[] | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      try {
        const values = Array.isArray(value) ? value : [value];

        for (const _value of values) {
          const hash = new Hash(_value);
          if (hash.toString().length !== this.length) {
            throw Error();
          }
        }

        return resolve(value);
      } catch (error) {
        throw new HttpException(`Validation failed (a valid ${this.entity} hash for parameter ${metadata.data} is expected)`, HttpStatus.BAD_REQUEST);
      }
    });
  }
}
