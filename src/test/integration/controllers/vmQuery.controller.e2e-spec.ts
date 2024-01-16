import { BadRequestException } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { VmQueryController } from "src/endpoints/vm.query/vm.query.controller";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

describe('VmQueryController', () => {
  let vmQueryController: VmQueryController;
  let vmQueryService: VmQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VmQueryController],
      providers: [
        {
          provide: VmQueryService,
          useValue: {
            vmQueryFullResult: jest.fn(),
          },
        },
      ],
    }).compile();

    vmQueryController = module.get<VmQueryController>(VmQueryController);
    vmQueryService = module.get<VmQueryService>(VmQueryService);
  });

  it('should be defined', () => {
    expect(vmQueryController).toBeDefined();
  });

  describe('query', () => {
    it('should return the data if the vm query is successful', async () => {
      const mockResult = {
        data: {
          data: {
            returnData: 'dummy data',
          },
        },
      };
      jest.spyOn(vmQueryService, 'vmQueryFullResult').mockResolvedValue(mockResult);

      const result = await vmQueryController.query({
        scAddress: 'dummy',
        funcName: 'dummy',
        caller: 'dummy',
        args: [],
        value: 'dummy',
      });

      expect(result).toEqual(mockResult.data.data);
    });

    it('should throw a BadRequestException if the vm query fails', async () => {
      const mockResult = {
        data: {
          data: {
            returnData: null,
            returnCode: 'dummy code',
            returnMessage: 'dummy message',
          },
        },
      };
      jest.spyOn(vmQueryService, 'vmQueryFullResult').mockResolvedValue(mockResult);

      await expect(
        vmQueryController.query({
          scAddress: 'dummy',
          funcName: 'dummy',
          caller: 'dummy',
          args: [],
          value: 'dummy',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
