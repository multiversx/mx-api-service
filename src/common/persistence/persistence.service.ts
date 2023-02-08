import configuration from "config/configuration";
import { Injectable } from "@nestjs/common";
import { ObjectLiteral, Repository } from "typeorm";
export const isPassThrough = process.env.PERSISTENCE === 'passthrough' || configuration().database?.enabled === false;

@Injectable()
export abstract class PersistenceService {
  constructor() { }

  async save<T extends ObjectLiteral>(repository: Repository<T>, entity: T) {
    try {
      // @ts-ignore
      await repository.save(entity);
    } catch (error) {
      // @ts-ignore
      if (error.code !== 11000) {
        throw error;
      }
    }
  }
}
