import tokenDetails from "../../mocks/esdt/token/tokenDetails";
const frisby = require('frisby');
const url: string =  'https://api.elrond.com/accounts';
//const Joi = require('@hapi/joi');

describe('Accounts Endpoint',  () => {
	it('/account - return two accounts',async() => {
		const params = new URLSearchParams({
			'from': '0',
			'size': '2',
		});

		return frisby
			.get(url + "?" + params)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.then(function (res: any) {
				const data = JSON.parse(res['_body']);
				expect(typeof data[0].address).toBe('string');
				expect(typeof data[0].balance).toBe('string');
				expect(typeof data[0].nonce).toBe('number');
				expect(typeof data[0].shard).toBe('number');
			});
	});

	it('/accounts/{address} - should return account based on address', async () => {
		const params = new URLSearchParams({
			'from': '0',
			'size': '1',
		});

		return frisby
			.get(url + "?" + params)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.then(function (res: any) {
				const accountAddress = res.json[0].address;
				return frisby.get('https://api.elrond.com/accounts/' + accountAddress)
					.expect('status', 200);
			});
	});

	it('/accounts/{address} - should return status code 400 `format of address is not bech32`', async () => {
		const invalidAddress = 'erd1sea63y47u569ns315mqjf4vnygn9whkk7p6ry4rfpqyd6rd5addqyd9lf2';

		return frisby
			.get(url + "/" + invalidAddress)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 400);
	});
	it('/accounts/count - should return total numbers of accounts', async () => {
		const url = 'https://api.elrond.com/accounts/';

		return frisby
			.get(url + 'count')
			.then(function (res: any) {
				const data = res['_body'];
				expect(typeof data).toBe('string');
				expect(data).toBeDefined();
			});
	});

	it('/accounts/{address}/deferred - should return deferred account', async () => {
		const params = new URLSearchParams({
			'from': '0',
			'size': '1',
		});

		return frisby
			.get(url + "?" + params)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.then(function (res: any) {
				const accountAddress = res.json[0].address;
				return frisby.get('https://api.elrond.com/accounts/' + accountAddress + "/deferred")
					.expect('status', 200);
			});
	});

	it('/accounts/{address}/tokens - should return a list of tokens for a specific address', async () => {
		const address = tokenDetails.owner;

		return frisby
			.get(url + "/" + address + '/tokens')
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200);
	});

	it('/accounts/{address}/tokens - should return 1 token for address based on identifier', async () => {
		const address = tokenDetails.owner;
		const param = new URLSearchParams({
			'identifier': 'QWT-46ac01',
		});

		return frisby
			.get(url + "/" + address + '/tokens' + "?" +param)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.then(function(res:any){
				const identifier = res.json[0].identifier;
				expect(identifier).toEqual(tokenDetails.identifier);
			});
	});
	it('/accounts/{address}}/tokens/count - should return tokens count for a specific address', async () => {
		const address = tokenDetails.owner;

		return frisby
			.get(url + "/" + address + "/tokens" + "/count")
			.expect('header', 'content-type', /text\/html/)
			.expect('status', 200)
			.then(function (res: any) {
				const data = res['_body'];
				expect(typeof data).toBe('string');
				expect(data).toBeDefined();
			});
	});
	it('/accounts/{address}/collections - should return all collections', async () => {
		const address = 'erd1yntjrye50jht0f6nk0kf057dtv9sgmjtwr7t3u3uuxh3v5ll63qqg55er2';
		const params = new URLSearchParams({
			'from': '0',
			'size': '1',
		});

		return frisby
			.get(url + "/" + address + "/collections" + "?" +params)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.then(function (res: any) {
				const data = JSON.parse(res['_body']);
				expect(data[0].collection).toEqual('IOTS1075-d46483');
				expect(data[0].type).toEqual('NonFungibleESDT');
				expect(data[0].name).toEqual('IoTS');
				expect(data[0].ticker).toEqual('IOTS1075-d46483');
				expect(data[0].canFreeze).toEqual(true);
				expect(data[0].canWipe).toEqual(false);
				expect(data[0].canPause).toEqual(true);
				expect(data[0].canTransferRole).toEqual(false);
				expect(data[0].canCreate).toEqual(true);
				expect(data[0].canBurn).toEqual(false);
			});
	});

	it('/accounts/{address}}/collections/count - should return collections count for a specific address', async () => {
		const address = 'erd1yntjrye50jht0f6nk0kf057dtv9sgmjtwr7t3u3uuxh3v5ll63qqg55er2';

		return frisby
			.get(url + "/" + address + "/collections" + "/count")
			.expect('header', 'content-type', /text\/html/)
			.expect('status', 200)
			.then(function (res: any) {
				const data = res['_body'];
				expect(data).toBeDefined();
				expect(data.length).toBe(1);
				expect(typeof data).toBe('string');
			});
	});

	it('/accounts/{address}/collections/{collections} - should return all collections based of address and collection filter', async () => {
		const address = 'erd1yntjrye50jht0f6nk0kf057dtv9sgmjtwr7t3u3uuxh3v5ll63qqg55er2';
		const collection = 'IOTS1075-d46483';

		return frisby
			.get(url + "/" + address + "/collections" + "/" + collection)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.then(function (res: any) {
				const data = JSON.parse(res['_body']);
				expect(data.collection).toEqual('IOTS1075-d46483');
				expect(data.type).toEqual('NonFungibleESDT');
				expect(data.name).toEqual('IoTS');
				expect(data.ticker).toEqual('IOTS1075-d46483');
				expect(data.canFreeze).toEqual(true);
				expect(data.canWipe).toEqual(false);
				expect(data.canPause).toEqual(true);
				expect(data.canTransferRole).toEqual(false);
				expect(data.canCreate).toEqual(true);
				expect(data.canBurn).toEqual(false);
			});
	});

	it('/accounts/{address}/tokens/{collections} - should return all tokens based of address and token identifier filter', async () => {
		const address = tokenDetails.owner;
		const tokenIdentifier = tokenDetails.identifier;
		return frisby
			.get(url + "/" + address + "/tokens" + "/" + tokenIdentifier)
			.expect('header', 'content-type', /application\/json/)
			.expect('status', 200)
			.then(function (res: any) {
				const data = JSON.parse(res['_body']);
				expect(data.identifier).toEqual(tokenDetails.identifier);
				expect(data.name).toEqual(tokenDetails.name);
				expect(data.owner).toEqual(tokenDetails.owner);
				expect(data.decimals).toEqual(tokenDetails.decimals);
				expect(data.isPaused).toEqual(tokenDetails.isPaused);
			});
	});
});