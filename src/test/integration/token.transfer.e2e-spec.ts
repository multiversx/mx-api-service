import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { TokenTransferService } from "../../endpoints/tokens/token.transfer.service";
import transactionsWithLogs from "../mocks/transactions/transactionsWithLogs";
import tokenDetails from "../mocks/esdt/token/token.example";
import { EsdtService } from "../../endpoints/esdt/esdt.service";

describe('Token Transfer Service', () => {
	let tokenTransferService: TokenTransferService;
	let esdtService: EsdtService;

	const txHash: string = '0a89f1b739e0d522d80159bfd3ba8565d04b175c704559898d0fb024a64aa48d';
	const tokenIdentifier: string = 'RIDE-7d18e9';
	const invalidTokenIdentifier: string = 'LKFARM-9d1ea8-4d2842';


	beforeAll(async () => {
		await Initializer.initialize();
		const moduleRef = await Test.createTestingModule({
			imports: [PublicAppModule],
		}).compile();

		tokenTransferService = moduleRef.get<TokenTransferService>(TokenTransferService);
		esdtService = moduleRef.get<EsdtService>(EsdtService);

	}, Constants.oneHour() * 1000);

	describe('Get Operations For Transaction Logs', () => {
		it('should return operations with transaction logs', async () => {
			const operations = await tokenTransferService.getOperationsForTransactionLogs(txHash, transactionsWithLogs);

			for (const operation of operations) {
				expect(operation).toEqual(
					expect.objectContaining({
						action: operation.action,
						identifier: operation.identifier,
						receiver: operation.receiver,
						sender: operation.sender,
						type: operation.type,
						value: operation.value,
					})
				);
			}
		});

		describe('Get Token Transfer Properties', () => {
			it('should return token transfer properties', async () => {
				const properties = await tokenTransferService.getTokenTransferProperties(tokenIdentifier);

				if(!properties){
					throw new Error('Properties are not defined');
				}

				expect(properties).toBeInstanceOf(Object);
			});

			it('should return null if token identifier is not valid', async () => {
				expect(await tokenTransferService.getTokenTransferProperties(invalidTokenIdentifier)).toBeNull();
			});

			it('token transfer should have "TokenTransferProperties"', async () => {
				const properties = await tokenTransferService.getTokenTransferProperties(tokenIdentifier);

				if (!properties) {
					throw new Error('Properties cannot be defined');
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
					throw new Error('Properties cannot be defined');
				}
				
				expect(properties.name).toBe(tokenDetails.name);
				expect(properties.type).toBe(tokenDetails.type);
				expect(properties.token).toBe(tokenDetails.identifier);
				expect(properties.decimals).toBe(tokenDetails.decimals);
			});

			it('should return null for invalidIdentifier and with null properties', async () => {
				const properties = await tokenTransferService.getTokenTransferPropertiesRaw(invalidTokenIdentifier);
				const getProperties = await esdtService.getEsdtTokenProperties(invalidTokenIdentifier);

				if (!getProperties) {
					await expect(properties).toBeNull();
				}
			});
		});
	});
});

