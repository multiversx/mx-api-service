import { AddressUtils } from "@multiversx/sdk-nestjs-common";

export class EsdtStorageDecoder {
  static readonly esdtKeyPrefix = 'ELRONDesdt';

  private static readonly tokenTypes = [
    'FungibleESDT',
    'NonFungibleESDT',
    'NonFungibleESDTv2',
    'SemiFungibleESDT',
    'MetaESDT',
    'DynamicNonFungibleESDT',
    'DynamicSemiFungibleESDT',
    'DynamicMetaESDT',
  ];

  private static readonly esdtTickerNumRandChars = 6;
  private static readonly minLengthForTickerName = 3;
  private static readonly maxLengthForTickerName = 10;

  static decodeTokens(pairs: Record<string, string>): Record<string, any> {
    const esdts: Record<string, any> = {};

    for (const [keyHex, valueHex] of Object.entries(pairs)) {
      const key = Buffer.from(keyHex, 'hex');
      if (!key.toString().startsWith(EsdtStorageDecoder.esdtKeyPrefix)) {
        continue;
      }

      const esdt = EsdtStorageDecoder.decodeToken(key.subarray(EsdtStorageDecoder.esdtKeyPrefix.length), Buffer.from(valueHex, 'hex'));
      if (BigInt(esdt.balance) > BigInt(0)) {
        esdts[esdt.tokenIdentifier] = esdt;
      }
    }

    return esdts;
  }

  private static decodeToken(tokenKey: Buffer, value: Buffer): any {
    const fields = EsdtStorageDecoder.readProtoFields(value);
    const type = Number(fields[1]?.[0] ?? 0);
    const properties = fields[3]?.[0] as Buffer | undefined;
    const metadata = fields[4]?.[0] as Buffer | undefined;
    const [tokenId, nonceHex] = EsdtStorageDecoder.extractTokenIdAndNonceHex(tokenKey);

    const isTypeNotSet = nonceHex !== '' && type === 1;

    const esdt: any = {
      tokenIdentifier: nonceHex ? `${tokenId}-${nonceHex}` : tokenId,
      balance: EsdtStorageDecoder.decodeBigInt(fields[2]?.[0] as Buffer | undefined).toString(),
      type: isTypeNotSet ? '' : EsdtStorageDecoder.tokenTypes[type] ?? 'Unknown',
    };

    if (properties && properties.length > 0) {
      esdt.properties = properties.toString('hex');
    }

    if (nonceHex) {
      esdt.nonce = parseInt(nonceHex, 16);
    }

    if (metadata) {
      Object.assign(esdt, EsdtStorageDecoder.decodeMetadata(metadata));
    }

    return esdt;
  }

  private static decodeMetadata(value: Buffer): any {
    const fields = EsdtStorageDecoder.readProtoFields(value);
    const name = fields[2]?.[0] as Buffer | undefined;
    const creator = fields[3]?.[0] as Buffer | undefined;
    const hash = fields[5]?.[0] as Buffer | undefined;
    const attributes = fields[7]?.[0] as Buffer | undefined;

    const metadata: any = {
      royalties: String(fields[4]?.[0] ?? 0),
    };

    if (name && name.length > 0) {
      metadata.name = name.toString();
    }

    if (creator && creator.length > 0) {
      metadata.creator = AddressUtils.bech32Encode(creator.toString('hex'));
    }

    if (hash && hash.length > 0) {
      metadata.hash = hash.toString('base64');
    }

    const uris = (fields[6] ?? []) as Buffer[];
    if (uris.length > 0) {
      metadata.uris = uris.map(uri => uri.toString('base64'));
    }

    if (attributes && attributes.length > 0) {
      metadata.attributes = attributes.toString('base64');
    }

    return metadata;
  }

  private static extractTokenIdAndNonceHex(tokenKey: Buffer): [string, string] {
    const indexOfFirstHyphen = tokenKey.indexOf('-');
    if (indexOfFirstHyphen < EsdtStorageDecoder.minLengthForTickerName || indexOfFirstHyphen > EsdtStorageDecoder.maxLengthForTickerName) {
      return [tokenKey.toString(), ''];
    }

    const nonceStart = indexOfFirstHyphen + 1 + EsdtStorageDecoder.esdtTickerNumRandChars;
    if (tokenKey.length <= nonceStart) {
      return [tokenKey.toString(), ''];
    }

    return [tokenKey.subarray(0, nonceStart).toString(), tokenKey.subarray(nonceStart).toString('hex')];
  }

  private static decodeBigInt(value: Buffer | undefined): bigint {
    if (!value || value.length < 2) {
      return BigInt(0);
    }

    const magnitude = BigInt(`0x${value.subarray(1).toString('hex')}`);

    return value[0] === 1 ? -magnitude : magnitude;
  }

  private static readProtoFields(buffer: Buffer): Record<number, (number | Buffer)[]> {
    const fields: Record<number, (number | Buffer)[]> = {};
    let offset = 0;

    while (offset < buffer.length) {
      const [tag, tagEnd] = EsdtStorageDecoder.readVarint(buffer, offset);
      const fieldNumber = Math.floor(tag / 8);
      const wireType = tag % 8;
      offset = tagEnd;

      fields[fieldNumber] = fields[fieldNumber] ?? [];

      switch (wireType) {
        case 0: {
          const [value, valueEnd] = EsdtStorageDecoder.readVarint(buffer, offset);
          fields[fieldNumber].push(value);
          offset = valueEnd;
          break;
        }
        case 1:
          offset += 8;
          break;
        case 2: {
          const [length, lengthEnd] = EsdtStorageDecoder.readVarint(buffer, offset);
          fields[fieldNumber].push(buffer.subarray(lengthEnd, lengthEnd + length));
          offset = lengthEnd + length;
          break;
        }
        case 5:
          offset += 4;
          break;
        default:
          throw new Error(`Unsupported protobuf wire type ${wireType}`);
      }
    }

    return fields;
  }

  private static readVarint(buffer: Buffer, offset: number): [number, number] {
    let value = 0;
    let multiplier = 1;
    let byte: number;

    do {
      if (offset >= buffer.length) {
        throw new Error('Truncated protobuf varint');
      }

      byte = buffer[offset++];
      value += (byte & 0x7f) * multiplier;
      multiplier *= 128;
    } while (byte & 0x80);

    return [value, offset];
  }
}
