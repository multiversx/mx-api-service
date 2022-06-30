import { DelegationService } from "../../endpoints/delegation/delegation.service";
import { Test } from "@nestjs/testing";
import { Delegation } from "../../endpoints/delegation/entities/delegation";
import '@elrondnetwork/erdnest-common/lib/src/utils/extensions/jest.extensions';
import '@elrondnetwork/erdnest-common/lib/src/utils/extensions/array.extensions';
import { PublicAppModule } from "src/public.app.module";

describe('Delegation Service', () => {
  let delegationService: DelegationService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    delegationService = moduleRef.get<DelegationService>(DelegationService);
  });

  describe('Get Delegation', () => {
    it('should return delegation objects', async () => {
      const delegation = await delegationService.getDelegation();
      expect(delegation).toHaveStructure(Object.keys(new Delegation()));
    });
  });

  describe('Get Delegation Raw', () => {
    it('should return delegation raw objects', async () => {
      const delegationRaw = await delegationService.getDelegationRaw();
      expect(delegationRaw).toHaveStructure(Object.keys(new Delegation()));
    });
  });
});
