import { lookup, promises as dns } from 'dns';
import { Agent } from 'https';
import { BlockList, isIP, LookupFunction } from 'net';

const nonPublicAddresses = new BlockList();

const nonPublicIpv4Subnets: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

const nonPublicIpv6Subnets: [string, number][] = [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
];

for (const [network, prefix] of nonPublicIpv4Subnets) {
  nonPublicAddresses.addSubnet(network, prefix, 'ipv4');
}

for (const [network, prefix] of nonPublicIpv6Subnets) {
  nonPublicAddresses.addSubnet(network, prefix, 'ipv6');
}

export function isPublicIp(address: string): boolean {
  const family = isIP(address);
  if (family === 0) {
    return false;
  }

  return !nonPublicAddresses.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

const publicAddressLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) {
      callback(error, '');
      return;
    }

    const nonPublicAddress = addresses.find(item => !isPublicIp(item.address));
    if (addresses.length === 0 || nonPublicAddress) {
      callback(new Error(`Host '${hostname}' resolves to non-public address '${nonPublicAddress?.address}'`), '');
      return;
    }

    if (options.all) {
      callback(null, addresses);
      return;
    }

    callback(null, addresses[0].address, addresses[0].family);
  });
};

export const publicHttpsAgent = new Agent({ lookup: publicAddressLookup });

export async function isSafePublicUrl(urlString: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(urlString);

    if (parsedUrl.protocol !== 'https:') {
      return false;
    }

    const addresses = await dns.lookup(parsedUrl.hostname, { all: true });

    return addresses.length > 0 && addresses.every(item => isPublicIp(item.address));
  } catch {
    return false;
  }
}
