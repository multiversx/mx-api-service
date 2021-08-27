Date.prototype.isToday = function(): boolean {
  return this.toISODateString() === new Date().toISODateString();
};

Date.prototype.toISODateString = function(): string {
  return this.toISOString().slice(0, 10);
};


declare interface Date {
  toISODateString(): string;
  isToday(): boolean;
}
