import { DelegationService } from "../../endpoints/delegation/delegation.service";
import { Test } from "@nestjs/testing";
import { Delegation } from "../../endpoints/delegation/entities/delegation";
import { DelegationModule } from "src/endpoints/delegation/delegation.module";
import '../../utils/extensions/jest.extensions';
import '../../utils/extensions/array.extensions';

describe('Delegation Service', () => {
  let delegationService: DelegationService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DelegationModule],
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
