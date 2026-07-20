import { promises as dns } from 'dns';

/**
 * Checks if an IP address (IPv4 or IPv6) belongs to a private or internal network.
 */
function isPrivateIp(ip: string): boolean {
  // IPv4 - Private classes, Loopback, Link-Local (AWS/GCP Metadata), and CGNAT
  const privateIpv4Regex = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.|0\.)/;

  if (privateIpv4Regex.test(ip)) {
    return true;
  }

  // IPv6 - Loopback (::1), Link-Local (fe80::), and Unique Local (fc00:: / fd00::)
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

/**
 * Validates a URL string to prevent SSRF (Server-Side Request Forgery) attacks.
 * Returns `true` if the URL is safe (public) and `false` if it points to a private/invalid destination.
 */
export async function isSafePublicUrl(urlString: string): Promise<boolean> {
  try {
    // 1. Validate URL structure and scheme
    const parsedUrl = new URL(urlString);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false; // Block unsupported protocols (e.g., file://, gopher://, ftp://)
    }

    // 2. Resolve domain name (DNS) to its IP address
    const { address } = await dns.lookup(parsedUrl.hostname);

    // 3. Check if the resolved IP is internal or private
    if (isPrivateIp(address)) {
      return false; // Block access to cluster IPs, localhost, or cloud metadata endpoints
    }

    return true; // The URL resolves to a safe public IP
  } catch {
    // If the URL is malformed or DNS resolution fails, treat it as unsafe
    return false;
  }
}
