import { DelegationService } from "../../endpoints/delegation/delegation.service";
import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";

describe('Delegation Service', () => {
  let delegationService: DelegationService;

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    delegationService = moduleRef.get<DelegationService>(DelegationService);

  }, Constants.oneHour() * 1000);

  describe('Get Delegation', () => {
    it('should return delegation value', async () => {
      const delegationValue = await delegationService.getDelegation();
      expect(delegationValue).toBeInstanceOf(Object);
    });
  });

  describe('Get Delegation Raw', () => {
    it('should return delegation raw', async () => {
      const delegationValue = await delegationService.getDelegationRaw();
      expect(delegationValue).toBeInstanceOf(Object);
    });
  });
});