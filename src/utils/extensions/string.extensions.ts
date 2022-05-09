String.prototype.removePrefix = function (prefix: string): string {
  if (this.startsWith(prefix)) {
    return this.slice(prefix.length);
  }

  return this.toString();
};

String.prototype.removeSuffix = function (suffix: string): string {
  if (this.endsWith(suffix)) {
    return this.slice(0, -suffix.length);
  }

  return this.toString();
};

declare interface String {
  removePrefix(prefix: string): string;
  removeSuffix(suffix: string): string;
}
