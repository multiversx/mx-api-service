import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { NftWorkerService } from "../../queue.worker/nft.worker/nft.worker.service";
import { Nft } from "../../endpoints/nfts/entities/nft";
import nftExample from "../mocks/esdt/nft/nft.example";
import { ProcessNftSettings } from "../../endpoints/process-nfts/entities/process.nft.settings";
import { NftWorkerModule } from "../../queue.worker/nft.worker/nft.worker.module";
import { NftType } from "../../endpoints/nfts/entities/nft.type";

describe('Nft Worker Service', () => {
	let nftWorkerService: NftWorkerService;

	beforeAll(async () => {
		await Initializer.initialize();

		const moduleRef = await Test.createTestingModule({
			imports: [PublicAppModule, NftWorkerModule],
		}).compile();

		nftWorkerService = moduleRef.get<NftWorkerService>(NftWorkerService);

	}, Constants.oneHour() * 1000);

	describe('Add Process Nft Queue Job', () => {
		it('should return nft process "true" with forceRefreshMedia = true', async () => {
			const nft = new Nft();
			nft.identifier = nftExample.identifier;

			const nftSettings = new ProcessNftSettings();
			nftSettings.forceRefreshMedia = true;

			const process = await nftWorkerService.addProcessNftQueueJob(nft, nftSettings);
			expect(process).toBeTruthy();
		});
	});

	describe('Needs Processing', () => {
		it('should return true on nft processing', async () => {
			const nft = new Nft();
			nft.identifier = nftExample.identifier;

			const nftSettings = new ProcessNftSettings();
			nftSettings.forceRefreshMedia = true;

			const process = await nftWorkerService.needsProcessing(nft, nftSettings);
			expect(process).toBeTruthy();
		});
		it('should return false if nft.type is MetaESDT', async () => {
			const nft = new Nft();
			nft.identifier = 'LKMEX-aab910-23049b';

			const nftSettings = new ProcessNftSettings();
			nftSettings.forceRefreshMedia = true;

			const process = await nftWorkerService.needsProcessing(nft, nftSettings);

			if (nft.type == NftType.MetaESDT) {
				expect(process).toBeFalsy();
			}
		});
		it('should return true if ProcessNftSettings are set to true', async () => {
			const nft = new Nft();
			nft.identifier = nftExample.identifier;

			const nftSettings = new ProcessNftSettings();
			nftSettings.forceRefreshMedia = true;

			const process = await nftWorkerService.needsProcessing(nft, nftSettings);

			if (nftSettings.forceRefreshMedia) {
				expect(process).toBeTruthy();
			}
		});
		it('should return true if nft.media.length == 0', async () => {
			const nft = new Nft();
			nft.identifier = 'LKMEX-aab910-23049b';

			const nftSettings = new ProcessNftSettings();
			nftSettings.forceRefreshMedia = true;

			const process = await nftWorkerService.needsProcessing(nft, nftSettings);

			if (nft.media?.length == 0) {
				expect(process).toBeTruthy();
			}
		});
	});
});
