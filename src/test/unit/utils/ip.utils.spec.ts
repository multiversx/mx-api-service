import { lookup, promises as dns } from 'dns';
import { request } from 'https';
import { isPublicIp, isSafePublicUrl, publicHttpsAgent } from 'src/utils/ip.utils';

jest.mock('dns', () => ({
  lookup: jest.fn(),
  promises: {
    lookup: jest.fn(),
  },
}));

describe('IP Utils', () => {
  const mockLookup = dns.lookup as unknown as jest.Mock;
  const mockCallbackLookup = lookup as unknown as jest.Mock;

  const nonPublicAddresses = [
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.0.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '198.18.0.1',
    '224.0.0.1',
    '::',
    '::1',
    'fe80::1',
    'fc00::1',
    'fd12:3456::1',
    'fec0::1',
    '::ffff:127.0.0.1',
    '::ffff:169.254.169.254',
    '64:ff9b::a9fe:a9fe',
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isPublicIp', () => {
    it('returns false for non-public ipv4 and ipv6 addresses', () => {
      for (const address of nonPublicAddresses) {
        expect(isPublicIp(address)).toBe(false);
      }
    });

    it('returns false for invalid addresses', () => {
      expect(isPublicIp('not-an-ip')).toBe(false);
    });

    it('returns true for public addresses', () => {
      expect(isPublicIp('93.184.216.34')).toBe(true);
      expect(isPublicIp('2606:2800:220:1::1')).toBe(true);
      expect(isPublicIp('::ffff:93.184.216.34')).toBe(true);
    });
  });

  describe('isSafePublicUrl', () => {
    it('returns false for invalid urls and non-https protocols', async () => {
      await expect(isSafePublicUrl('not-a-url')).resolves.toBe(false);
      await expect(isSafePublicUrl('ftp://example.com')).resolves.toBe(false);
      await expect(isSafePublicUrl('http://example.com')).resolves.toBe(false);
      expect(mockLookup).not.toHaveBeenCalled();
    });

    it('returns false when any resolved address is non-public', async () => {
      mockLookup.mockResolvedValueOnce([
        { address: '93.184.216.34', family: 4 },
        { address: '::ffff:127.0.0.1', family: 6 },
      ]);

      await expect(isSafePublicUrl('https://example.com')).resolves.toBe(false);
      expect(mockLookup).toHaveBeenCalledWith('example.com', { all: true });
    });

    it('returns true when all resolved addresses are public', async () => {
      mockLookup.mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }]);

      await expect(isSafePublicUrl('https://example.com')).resolves.toBe(true);
    });

    it('returns false when dns lookup fails', async () => {
      mockLookup.mockRejectedValueOnce(new Error('DNS failure'));

      await expect(isSafePublicUrl('https://example.com')).resolves.toBe(false);
    });
  });

  describe('publicHttpsAgent', () => {
    const agentLookup = (publicHttpsAgent as any).options.lookup;

    it('rejects connections to non-public addresses', (done) => {
      mockCallbackLookup.mockImplementationOnce((_hostname, _options, callback) => callback(null, [{ address: '127.0.0.1', family: 4 }]));

      agentLookup('example.com', {}, (error: Error | null) => {
        expect(error?.message).toContain('non-public address');
        done();
      });
    });

    it('rejects hosts without addresses', (done) => {
      mockCallbackLookup.mockImplementationOnce((_hostname, _options, callback) => callback(null, []));

      agentLookup('example.com', {}, (error: Error | null) => {
        expect(error?.message).toContain('does not resolve to any address');
        done();
      });
    });

    it.each(['127.0.0.1', '::1'])('refuses connections to the non-public ip literal %s', (hostname, done) => {
      request({ hostname, port: 443, agent: publicHttpsAgent })
        .on('error', (error) => {
          expect(error.message).toBe(`Refusing connection to non-public address '${hostname}'`);
          expect(mockCallbackLookup).not.toHaveBeenCalled();
          done();
        })
        .end();
    });

    it('resolves public addresses', (done) => {
      mockCallbackLookup.mockImplementationOnce((_hostname, _options, callback) => callback(null, [{ address: '93.184.216.34', family: 4 }]));

      agentLookup('example.com', {}, (error: Error | null, address: string, family: number) => {
        expect(error).toBeNull();
        expect(address).toBe('93.184.216.34');
        expect(family).toBe(4);
        done();
      });
    });
  });
});
