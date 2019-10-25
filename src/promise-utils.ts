export function testPromise(data: any): boolean {
  return Promise.resolve(data) == data; // tslint:disable-line
}
