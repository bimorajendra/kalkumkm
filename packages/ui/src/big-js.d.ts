declare module 'big.js' {
  class Big {
    constructor(value: Big | number | string);
    static readonly roundHalfUp: number;
    static readonly roundDown: number;
    static readonly roundUp: number;
    abs(): Big;
    div(value: Big | number | string): Big;
    eq(value: Big | number | string): boolean;
    gte(value: Big | number | string): boolean;
    gt(value: Big | number | string): boolean;
    lte(value: Big | number | string): boolean;
    lt(value: Big | number | string): boolean;
    minus(value: Big | number | string): Big;
    plus(value: Big | number | string): Big;
    round(decimalPlaces?: number, roundingMode?: number): Big;
    toNumber(): number;
    toString(): string;
    times(value: Big | number | string): Big;
  }
  export default Big;
}
