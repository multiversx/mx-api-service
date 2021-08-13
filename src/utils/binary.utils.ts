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
    let str = '';
    for (let n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    
    return str;
  }
  
  static padHex(value: string): string {
    return (value.length % 2 ? '0' + value : value);
  }
}