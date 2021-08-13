function base64DecodeBinary(str: string): Buffer {
  return Buffer.from(str, 'base64');
};

export class BinaryUtils {
  static base64Encode(str: string) {
    return Buffer.from(str).toString('base64');
  };
  
  static base64Decode(str: string): string {
    return base64DecodeBinary(str).toString('binary');
  }
  
  static hexToString(hex: string): string {
    return Buffer.from(hex, 'hex').toString('ascii');
  }
  
  static padHex(value: string): string {
    return (value.length % 2 ? '0' + value : value);
  }
}