Number.prototype.toRounded = function (digits: number): number {
  return parseFloat(this.toFixed(digits));
};

declare interface Number {
  toRounded(digits: number): number;
}
