import * as crypto from 'crypto-js';
import { dnsContracts } from './constants/dnscontracts';

export class UsernameUtils {
  static normalizeUsername(username: string): string {
    const prefix = '@';
    const suffix = '.elrond';

    let normalizedUsername = username.toLowerCase().replace(/\W/g, '');

    if (normalizedUsername.startsWith(prefix)) {
      normalizedUsername = normalizedUsername.substring(prefix.length);
    }

    if (!normalizedUsername.endsWith(suffix)) {
      normalizedUsername += suffix;
    }

    return normalizedUsername;
  }

  static getContractAddress(username: string): string {
    const normalized = UsernameUtils.normalizeUsername(username);

    const hash = crypto.SHA3(normalized, { outputLength: 256 }).toString(crypto.enc.Hex);

    const buffer = Buffer.from(hash, 'hex');
    const last = buffer[buffer.length - 1];

    return dnsContracts[last];
  }

  static encodeUsername(username: string): string {
    const normalized = UsernameUtils.normalizeUsername(username);
    return Buffer.from(normalized).toString('hex');
  }
}
