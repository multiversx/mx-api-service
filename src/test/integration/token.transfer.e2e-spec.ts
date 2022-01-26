import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {Constants} from "../../utils/constants";
import {TokenTransferService} from "../../endpoints/tokens/token.transfer.service";
import transactionsWithLogs from "../testUtils/apiToken/transactionsWithLogs";

describe('Token Transfer Service', () => {
	let tokenTransferService: TokenTransferService;

	const txHash: string = '0a89f1b739e0d522d80159bfd3ba8565d04b175c704559898d0fb024a64aa48d';

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
	});
});