import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {Constants} from "../../utils/constants";
import {TokenTransferService} from "../../endpoints/tokens/token.transfer.service";
import transactionsWithLogs from "../testUtils/apiToken/transactionsWithLogs";

describe('Token Transfer Service', () => {
	let tokenTransferService: TokenTransferService;

	const txHash: string = '0a89f1b739e0d522d80159bfd3ba8565d04b175c704559898d0fb024a64aa48d';
	const tokenIdentifier: string = 'RIDE-7d18e9';
	const invalidTokenIdentifier: string = 'LKFARM-9d1ea8-4d2842';


	beforeAll(async () => {
		await Initializer.initialize();
		const moduleRef = await Test.createTestingModule({
			imports: [PublicAppModule],
		}).compile();

		tokenTransferService = moduleRef.get<TokenTransferService>(TokenTransferService);
	}, Constants.oneHour() * 1000);

	describe('Get Operations For Transaction Logs', () => {
		it('should return operations with transaction logs', async () => {
			const operations = await tokenTransferService.getOperationsForTransactionLogs(txHash, transactionsWithLogs);
			expect(operations).toBeInstanceOf(Array);
		});

		it('should return operations with transaction logs', async () => {
			const operations = await tokenTransferService.getOperationsForTransactionLogs(txHash, transactionsWithLogs);
			expect(operations).toBeInstanceOf(Array);
		});

		it('verify if operations results contains properties of "TransactionOperation"', async () => {
			const operations = await tokenTransferService.getOperationsForTransactionLogs(txHash, transactionsWithLogs);
			expect(operations).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						"action": "transfer",
						"collection": "LKFARM-9d1ea8",
						"decimals": 18,
						"esdtType": "MetaESDT",
						"identifier": "LKFARM-9d1ea8-4d2842",
						"name": "LockedLPStaked",
						"receiver": "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl",
						"sender": "erd1hz65lr7ry7sa3p8jjeplwzujm2d7ktj7s6glk9hk8f4zj8znftgqaey5f5",
						"type": "nft",
						"value": "1019407981831508973285"}),
				])
			);
		});

		describe('Get Token Transfer Properties', () => {
			it('should return token transfer properties', async () => {
				const properties = await tokenTransferService.getTokenTransferProperties(tokenIdentifier);
				expect(properties).toBeInstanceOf(Object);
			});

			it('should return null if token identifier is not valid', async () => {
				const properties = await tokenTransferService.getTokenTransferProperties(invalidTokenIdentifier);
				expect(properties).toBeNull();
			});

			it('token transfer should have "TokenTransferProperties"', async () => {
				const properties = await tokenTransferService.getTokenTransferProperties(tokenIdentifier);
				expect(properties?.type).toBe('FungibleESDT');
				expect(properties?.name).toBe('holoride');
				expect(properties?.ticker).toBe('RIDE');
				expect(properties?.token).toBe('RIDE-7d18e9');
				expect(properties?.decimals).toBe(18);
			});
		});
	});
});

