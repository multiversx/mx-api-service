import { DelegationService } from "../../endpoints/delegation/delegation.service";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Delegation } from "../../endpoints/delegation/entities/delegation";

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
