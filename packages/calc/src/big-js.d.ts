declare module 'big.js' {
  class Big {
    constructor(value: Big | number | string);
    static readonly roundDown: number;
    static readonly roundHalfUp: number;
    static readonly roundUp: number;
    plus(value: Big | number | string): Big;
    minus(value: Big | number | string): Big;
    times(value: Big | number | string): Big;
    div(value: Big | number | string): Big;
    round(decimalPlaces?: number, roundingMode?: number): Big;
    lt(value: Big | number | string): boolean;
    lte(value: Big | number | string): boolean;
    gt(value: Big | number | string): boolean;
    gte(value: Big | number | string): boolean;
    eq(value: Big | number | string): boolean;
    toNumber(): number;
    toString(): string;
  }
  export default Big;
}
