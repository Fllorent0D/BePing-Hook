export class GuardError implements Error {
  public name: string;

  constructor (public message: string) {
    this.name = GuardError.name;
  }
}
