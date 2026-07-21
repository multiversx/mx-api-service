import { promises as dns } from 'dns';

function isPrivateIp(ip: string): boolean {
  const privateIpv4Regex = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.|0\.)/;

  if (privateIpv4Regex.test(ip)) {
    return true;
  }

  const normalizedIpv6 = ip.toLowerCase();
  if (
    normalizedIpv6 === '::1' ||
    normalizedIpv6.startsWith('fe80:') ||
    normalizedIpv6.startsWith('fc00:') ||
    normalizedIpv6.startsWith('fd00:')
  ) {
    return true;
  }

  return false;
}

export async function isSafePublicUrl(urlString: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(urlString);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    const { address } = await dns.lookup(parsedUrl.hostname);

    if (isPrivateIp(address)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
