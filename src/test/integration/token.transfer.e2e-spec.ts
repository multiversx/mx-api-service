import { Test } from "@nestjs/testing";
import { TokenTransferService } from "../../endpoints/tokens/token.transfer.service";
import transactionsWithLogs from "../data/transactions/transactions.with.logs";
import tokenDetails from "../data/esdt/token/token.example";
import { EsdtService } from "../../endpoints/esdt/esdt.service";
import { EsdtModule } from "src/endpoints/esdt/esdt.module";
import { TokenModule } from "src/endpoints/tokens/token.module";

describe('Token Transfer Service', () => {
  let tokenTransferService: TokenTransferService;
  let esdtService: EsdtService;

  const txHash: string = '0a89f1b739e0d522d80159bfd3ba8565d04b175c704559898d0fb024a64aa48d';
  const tokenIdentifier: string = 'RIDE-7d18e9';
  const invalidTokenIdentifier: string = 'LKFARM-9d1ea8-4d2842';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EsdtModule, TokenModule],
    }).compile();

    tokenTransferService = moduleRef.get<TokenTransferService>(TokenTransferService);
    esdtService = moduleRef.get<EsdtService>(EsdtService);
  });

  describe('Get Operations For Transaction Logs', () => {
    it('should return operations with transaction logs', async () => {
      const operations = await tokenTransferService.getOperationsForTransactionLogs(txHash, transactionsWithLogs);

      for (const operation of operations) {
        expect(operation).toHaveProperty('action');
        expect(operation).toHaveProperty('identifier');
        expect(operation).toHaveProperty('receiver');
        expect(operation).toHaveProperty('sender');
        expect(operation).toHaveProperty('type');
        expect(operation).toHaveProperty('value');
      }
    });

    describe('Get Token Transfer Properties', () => {
      it('should return token transfer properties', async () => {
        const properties = await tokenTransferService.getTokenTransferProperties(tokenIdentifier);
        if (!properties) {
          throw new Error('Properties are not defined');
        }

        expect(properties).toHaveProperty('type');
        expect(properties).toHaveProperty('ticker');
        expect(properties).toHaveProperty('name');
        expect(properties).toHaveProperty('svgUrl');
      });

      it('should return null if token identifier is not valid', async () => {
        const properties = await tokenTransferService.getTokenTransferProperties(invalidTokenIdentifier);
        expect(properties).toBeNull();
      });

      it('token transfer should have "TokenTransferProperties"', async () => {
        const properties = await tokenTransferService.getTokenTransferProperties(tokenIdentifier);
        if (!properties) {
          throw new Error('Properties not defined');
        }

        expect(properties.type).toBeDefined;
        expect(properties.name).toBeDefined;
        expect(properties.token).toBeDefined;
        expect(properties.decimals).toBeDefined;
      });
    });

    describe('Get Token Transfer Properties Raw', () => {
      it('should return token transfer properties raw based on identifier', async () => {
        const properties = await tokenTransferService.getTokenTransferPropertiesRaw(tokenDetails.identifier);
        if (!properties) {
          throw new Error('Properties not defined');
        }

        expect(properties.name).toBe(tokenDetails.name);
        expect(properties.type).toBe(tokenDetails.type);
        expect(properties.token).toBe(tokenDetails.identifier);
        expect(properties.decimals).toBe(tokenDetails.decimals);
      });

      it('should return null for invalidIdentifier and with null properties', async () => {
        const transferProperties = await tokenTransferService.getTokenTransferPropertiesRaw(invalidTokenIdentifier);
        const esdtProperties = await esdtService.getEsdtTokenProperties(invalidTokenIdentifier);

        expect(esdtProperties).toBeUndefined();
        expect(transferProperties).toBeNull();
      });
    });
  });
});

