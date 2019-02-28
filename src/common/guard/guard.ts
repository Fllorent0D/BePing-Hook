import { GuardError } from './guard-error';

export class Guard {

  static isNotUndefined (value: string, prop: string): boolean {
    const res = value !== undefined;
    if (res) {
      return res;
    }
    throw new GuardError(`${prop} is undefined !`);
  }

  static isNotNull (value: string, prop: string): boolean {
    const res = value !== undefined && value !== null;
    if (res) {
      return res;
    }
    throw new GuardError(`${prop} is null !`);
  }

  static isNotNullOrEmpty (value: string, prop: string): boolean {
    const res = value !== undefined && value !== null && value !== '';
    if (res) {
      return res;
    }
    throw new GuardError(`${prop} is null or empty`);
  }

  static isPositive (value: number, prop: string): boolean {
    const res = value >= 0;
    if (res) {
      return res;
    }
    throw new GuardError(`${prop} is not positive`);
  }

  static isNumber (value: any, prop: string): boolean {
    let res = Guard.isNotNullOrEmpty(value, prop);
    if (res) {
      res = typeof value === 'number';
    }
    if (res) {
      return res;
    }
    throw new GuardError(`${prop} is not a number`);
  }

  static isString (value: any, prop: string): boolean {
    let res = Guard.isNotNullOrEmpty(value, prop);
    if (res) {
      res = typeof value === 'string';
    }
    if (res) {
      return res;
    }
    throw new GuardError(`${prop} is not a string`);
  }

  static isDate (value: any, prop: string): boolean {
    let res = Guard.isNotNullOrEmpty(value, prop);
    if (res) {
      res = value instanceof Date;
    }
    if (res) {
      return res;
    }
    throw new GuardError(`${prop} is not a date`);
  }

  static isValidDateTime (value: number, prop: string): boolean {
    const res = !isNaN(new Date(value).valueOf());
    if (res) {
      return res;
    }
    throw new GuardError(`${prop} is not a valid date time`);
  }

  static isNotNullOrUndefined (value: any, prop: string): boolean {
    if (typeof value !== 'undefined' && value) {
      return true;
    }
    throw new GuardError(`${prop} is null or undefined`);
  }

  static isValueOfEnum (value: string, enumerator: any, enumeratorName: string, prop: string): boolean {
    if (enumerator[ value ]) {
      return true;
    }
    throw new GuardError(`${value} is not a value of ${enumeratorName} for ${prop}`);
  }
}
