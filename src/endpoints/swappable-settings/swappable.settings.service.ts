import { Injectable } from "@nestjs/common";
import { PersistenceService } from "src/common/persistence/persistence.service";

@Injectable()
export class SwappableSettingsService {
  constructor(
    private readonly persistenceService: PersistenceService
  ) { }

  async getValue(identifier: string): Promise<unknown> {
    return await this.persistenceService.getSettingValue(identifier);
  }

  async setValue(identifier: string, value: boolean): Promise<unknown> {
    return await this.persistenceService.setSettingValue(identifier, value);
  }

  async deleteKey(identifier: string): Promise<unknown> {
    return await this.persistenceService.deleteSettingKey(identifier);
  }
}
