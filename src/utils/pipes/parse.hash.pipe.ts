import { Hash } from "@elrondnetwork/erdjs/out/hash";
import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";

export class ParseHashPipe implements PipeTransform<string | undefined, Promise<string | undefined>> {
  private entity: string;
  private length: number;
  constructor(entity: string, length: number) {
    this.entity = entity;
    this.length = length;
  }

  transform(value: string | undefined, _: ArgumentMetadata): Promise<string | undefined> {
    return new Promise(resolve => {
      if (value === undefined || value === '') {
        return resolve(undefined);
      }

      try {
        const hash = new Hash(value);
        if (hash.toString().length !== this.length) {
          throw Error();
        }
        return resolve(value);
      } catch (error) {
        throw new HttpException(`Validation failed (a valid hash with size ${this.length} for ${this.entity} is expected)`, HttpStatus.BAD_REQUEST);
      }
    });
  }
}
