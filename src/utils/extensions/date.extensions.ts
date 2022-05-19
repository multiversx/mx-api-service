Date.prototype.isToday = function (): boolean {
  return this.toISODateString() === new Date().toISODateString();
};

Date.prototype.toISODateString = function (): string {
  return this.toISOString().slice(0, 10);
};

Date.prototype.isGreaterThan = function (other: Date): boolean {
  return this.getTime() > other.getTime();
};

Date.prototype.isLessThan = function (other: Date): boolean {
  return this.getTime() < other.getTime();
};

declare interface Date {
  toISODateString(): string;
  isToday(): boolean;
  isGreaterThan(other: Date): boolean;
  isLessThan(other: Date): boolean;
}
