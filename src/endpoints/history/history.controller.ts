import { Controller,  Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Data } from "./entities/data";
import { HistoryService } from "./history.service";

@Controller()
@ApiTags('history')
export class HistoryController {
	constructor(private readonly historyService: HistoryService) {}

	@Get("/history/price")
	@ApiResponse({
		status: 200,
		description: 'The history of prices for EGLD',
		type: Data,
		isArray: true
	})
	async getPrices(): Promise<Data[]> {
		return await this.historyService.getPrices();
	}

	@Get("/history/latest/price")
	@ApiResponse({
		status: 200,
		description: 'The current price for EGLD',
		type: Number,
		isArray: true
	})
	async getLatestPrice(): Promise<Number> {
		return await this.historyService.getLatestPrice();
	}

  @Get("/history/market_cap")
	@ApiResponse({
		status: 200,
		description: 'The history of market cap on for EGLD',
		type: Data,
		isArray: true
	})
	async getMarketCap(): Promise<Data[]> {
		return await this.historyService.getMarketCap();
	}


  @Get("/history/latest/market_cap")
	@ApiResponse({
		status: 200,
		description: 'The current market cap for EGLD',
		type: Number,
		isArray: true
	})
	async getLatestMarketCap(): Promise<Number> {
		return await this.historyService.getLatestMarketCap();
	}

  @Get("/history/volume_24h")
	@ApiResponse({
		status: 200,
		description: 'The history of 24h volume for EGLD',
		type: Data,
		isArray: true
	})
	async getVolume24h(): Promise<Data[]> {
		return await this.historyService.getVolume24h();
	}

  @Get("/history/staking/value")
	@ApiResponse({
		status: 200,
		description: 'The history of staking value for EGLD',
		type: Data,
		isArray: true
	})
	async getStakingValue(): Promise<Data[]> {
		return await this.historyService.getStakingValue();
	}

  @Get("/history/staking/users")
	@ApiResponse({
		status: 200,
		description: 'The history of number of staking users for EGLD',
		type: Number,
		isArray: true
	})
	async getStakingUsers(): Promise<number> {
		return await this.historyService.getStakingUsers();
	}

  @Get("/history/transactions/count_24h")
	@ApiResponse({
		status: 200,
		description: 'The history of transactions count in 24h for EGLD',
		type: Data,
		isArray: true
	})
	async getTransactionsCount24h(): Promise<Data[]> {
		return await this.historyService.getTransactionsCount24h();
	}

	@Get("/history/accounts/count")
	@ApiResponse({
		status: 200,
		description: 'The history of accounts count in 24h for EGLD',
		type: Data,
		isArray: true
	})
	async getAccountsCount(): Promise<Data[]> {
		return await this.historyService.getAccountsCount();
	}
}