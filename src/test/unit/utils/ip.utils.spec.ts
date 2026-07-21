import { promises as dns } from 'dns';
import { isSafePublicUrl } from 'src/utils/ip.utils';

jest.mock('dns', () => ({
  promises: {
    lookup: jest.fn(),
  },
}));

describe('IP Utils', () => {
  const mockLookup = dns.lookup as jest.MockedFunction<typeof dns.lookup>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false for invalid urls and unsupported protocols', async () => {
    await expect(isSafePublicUrl('not-a-url')).resolves.toBe(false);
    await expect(isSafePublicUrl('ftp://example.com')).resolves.toBe(false);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('returns false for private ipv4 and ipv6 addresses', async () => {
    const privateAddresses = [
      '127.0.0.1',
      '10.0.0.1',
      '172.16.0.1',
      '192.168.0.1',
      '169.254.0.1',
      '100.64.0.1',
      '0.0.0.0',
      '::1',
      'fe80::1',
      'fc00::1',
      'fd00::1',
    ];

    for (const address of privateAddresses) {
      mockLookup.mockResolvedValueOnce({ address, family: 4 } as any);

      await expect(isSafePublicUrl('https://example.com')).resolves.toBe(false);
    }

    expect(mockLookup).toHaveBeenCalledTimes(privateAddresses.length);
  });

  it('returns false for localhost resolving to a private ip', async () => {
    mockLookup.mockResolvedValueOnce({ address: '127.0.0.1', family: 4 } as any);

    await expect(isSafePublicUrl('http://localhost')).resolves.toBe(false);
    expect(mockLookup).toHaveBeenCalledWith('localhost');
  });

  it('returns true for public addresses', async () => {
    mockLookup.mockResolvedValueOnce({ address: '93.184.216.34', family: 4 } as any);

    await expect(isSafePublicUrl('https://example.com')).resolves.toBe(true);
    expect(mockLookup).toHaveBeenCalledWith('example.com');
  });

  it('returns false when dns lookup fails', async () => {
    mockLookup.mockRejectedValueOnce(new Error('DNS failure'));

    await expect(isSafePublicUrl('https://example.com')).resolves.toBe(false);
  });
});
