import { Hash } from "@elrondnetwork/erdjs/out/hash";
import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from "@nestjs/common";

const HASH_SIZE = 64;

export class ParseHashPipe implements PipeTransform<string | undefined, Promise<string | undefined>> {
    transform(value: string | undefined, _: ArgumentMetadata): Promise<string | undefined> {
        return new Promise(resolve => {
            if (value === undefined || value === '') {
                return resolve(undefined);
            }

            try {
              const hash = new Hash(value);
              if (hash.toString().length !== HASH_SIZE) {
                throw Error();
              }
              return resolve(value);
            } catch(error){
              throw new HttpException(`Validation failed (a hash with length ${HASH_SIZE} is expected)`, HttpStatus.BAD_REQUEST);
            }
        });
    }
}