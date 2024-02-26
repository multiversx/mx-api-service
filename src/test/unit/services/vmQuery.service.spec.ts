import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { TestingModule, Test } from "@nestjs/testing";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { SettingsService } from "src/common/settings/settings.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

describe('VmQueryService', () => {
  let service: VmQueryService;
  let cacheService: CacheService;
  let gatewayService: GatewayService;
  let protocolService: ProtocolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VmQueryService,
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            createRaw: jest.fn(),
          },
        },
        {
          provide: ProtocolService,
          useValue: {
            getSecondsRemainingUntilNextRound: jest.fn(),
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getUseVmQueryTracingFlag: jest.fn(),
          },
        },
        EventEmitter2,
      ],
    }).compile();

    service = module.get<VmQueryService>(VmQueryService);
    cacheService = module.get<CacheService>(CacheService);
    gatewayService = module.get<GatewayService>(GatewayService);
    protocolService = module.get<ProtocolService>(ProtocolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('vmQueryFullResult', () => {
    const contract = 'contract';
    const func = 'func';
    const caller = 'caller';
    const args = ['arg1', 'arg2'];
    const value = 'value';
    const key = `vm-query:${contract}:${func}:${caller}@${args.join('@')}`;

    beforeEach(() => {
      jest.spyOn(protocolService, 'getSecondsRemainingUntilNextRound').mockResolvedValue(10);
    });

    it('should call CacheService.getOrSet with the correct arguments', async () => {
      jest.spyOn(gatewayService, 'createRaw').mockResolvedValue({ data: {} });
      await service.vmQueryFullResult(contract, func, caller, args, value, undefined);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(key, expect.any(Function), 10, 10);
    });
  });

  describe('vmQuery', () => {
    const contract = 'contract';
    const func = 'func';
    const caller = 'caller';
    const args = ['arg1', 'arg2'];
    const value = 'value';
    const returnData = ['returnData1', 'returnData2'];
    const vmQueryResult = { data: { data: { returnData } } };

    beforeEach(() => {
      jest.spyOn(protocolService, 'getSecondsRemainingUntilNextRound').mockResolvedValue(10);
    });

    it('should return the vm query result if skipCache is true', async () => {
      jest.spyOn(service, 'vmQueryRaw').mockResolvedValue(vmQueryResult);
      const result = await service.vmQuery(contract, func, caller, args, value, true);
      expect(result).toBe(returnData);
    });

    it('should return the vm query result if skipCache is false', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(vmQueryResult);
      const result = await service.vmQuery(contract, func, caller, args, value, false);
      expect(result).toBe(returnData);
    });

    it('should throw an error if the vm query fails', async () => {
      const error = new Error('VM query failed');
      jest.spyOn(service, 'vmQueryRaw').mockRejectedValue(error);
      jest.spyOn(service['logger'], 'error').mockImplementation(() =>
        "Error in vm query for address 'contract', function 'func', caller 'caller', value 'value', args['']. Error message: undefined");

      await expect(service.vmQuery(contract, func, caller, args, value)).rejects.toThrow("Cannot read properties of undefined (reading 'data')");
    });
  });

  describe('vmQueryRaw', () => {
    const contract = 'contract';
    const func = 'func';
    const caller = 'caller';
    const args = ['arg1', 'arg2'];
    const value = 'value';
    const vmQueryResult = { data: {} };

    it('should return the vm query result', async () => {
      jest.spyOn(gatewayService, 'createRaw').mockResolvedValue(vmQueryResult);
      const result = await service.vmQueryRaw(contract, func, caller, args, value);
      expect(result).toBe(vmQueryResult.data);
    });

    it('should throw an error if the vm query fails', async () => {
      const error = new Error('VM query failed');
      jest.spyOn(gatewayService, 'createRaw').mockRejectedValue(error);
      await expect(service.vmQueryRaw(contract, func, caller, args, value)).rejects.toThrow(error);
    });
  });
});
