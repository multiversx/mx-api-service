const frisby = require('frisby');
const Joi = frisby.Joi;

describe('Network Endpoint',  () => {
	it('/mex-economics - should return informations about:' +
		'totalSupply,' +
		'circulationSupply,' +
		'price,' +
		'marketCap,' +
		'volume24h,' +
		'marketPairs', () => {

		const url: string =  'https://api.elrond.com/mex-economics';
		return frisby
			.get(url)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.expect('jsonTypes', {
				totalSupply: Joi.number(),
				circulatingSupply: Joi.number(),
				price: Joi.number(),
				marketCap: Joi.number(),
				volume24h: Joi.number(),
				marketPairs: Joi.number(),
			});
	});

	it('/mex-pairs - should return mex pair ( MEX - WEGLD )', () => {
		const params = new URLSearchParams({
			'from': '0',
			'size': '1',
		});

		const url: string =  'https://api.elrond.com/mex-pairs';
		return frisby
			.get(url + "?" + params)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.expect('jsonTypes','*', {
				baseId: Joi.string(),
				basePrice: Joi.number(),
				baseSymbol: Joi.string(),
				baseName: Joi.string(),
				quoteId: Joi.string(),
				quotePrice: Joi.number(),
				quoteSymbol: Joi.string(),
				quoteName: Joi.string(),
			});
	});

	it('/constants - should return informations about:' +
		'chainId,' +
		'gasPerDataByte,' +
		'minGasLimit,' +
		'minGasLimit,' +
		'minTransactionVersion', () => {

		const url: string =  'https://api.elrond.com/constants';
		return frisby
			.get(url)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.expect('jsonTypes', {
				chainId: Joi.string(),
				gasPerDataByte: Joi.number(),
				minGasLimit: Joi.number(),
				minGasPrice: Joi.number(),
				minTransactionVersion: Joi.number(),
			});
	});

	it('/economics - should return informations about:' +
		'totalSupply,' +
		'circulatingSupply,' +
		'staked,' +
		'price,' +
		'marketCap,' +
		'apr,' +
		'topUpApr,' +
		'baseApr', () => {

		const url: string =  'https://api.elrond.com/economics';
		return frisby
			.get(url)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.expect('jsonTypes', {
				totalSupply: Joi.number(),
				circulatingSupply: Joi.number(),
				staked: Joi.number(),
				price: Joi.number(),
				apr: Joi.number(),
				topUpApr: Joi.number(),
				baseApr: Joi.number(),
			});
	});

	it('/stats - should return informations about:' +
		'shards,' +
		'blocks,' +
		'accounts,' +
		'transactions,' +
		'refreshRate,' +
		'epoch,' +
		'roundsPassed,' +
		'roundsPerEpoch', () => {

		const url: string =  'https://api.elrond.com/stats';
		return frisby
			.get(url)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.expect('jsonTypes', {
				shards: Joi.number(),
				blocks: Joi.number(),
				accounts: Joi.number(),
				transactions: Joi.number(),
				refreshRate: Joi.number(),
				epoch: Joi.number(),
				roundsPassed: Joi.number(),
				roundsPerEpoch: Joi.number(),

			});
	});
});
