import '@elrondnetwork/erdnest/lib/src/utils/extensions/string.extensions';

describe('String Extensions', () => {
  it('removePrefix', () => {
    expect('hello world'.removePrefix('hello')).toEqual(' world');
    expect('hello world'.removePrefix('helllo')).toEqual('hello world');
  });

  it('removeSuffix', () => {
    expect('hello world'.removeSuffix('world')).toEqual('hello ');
    expect('hello world'.removeSuffix('worlld')).toEqual('hello world');
  });

  it('removePrefix & removeSuffix', () => {
    expect(
      'https://bafybeigc7veznuahvghwz4viugnp3ulegsbkiqld7466u5migimuzhp6bq.ipfs.dweb.link'
        .removeSuffix('.ipfs.dweb.link')
        .removePrefix('https://')
    ).toEqual('bafybeigc7veznuahvghwz4viugnp3ulegsbkiqld7466u5migimuzhp6bq');
  });
});
