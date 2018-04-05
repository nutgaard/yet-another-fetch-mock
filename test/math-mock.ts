export default class MathMock {
  private static oldMath = global.Math;
  private static newMath = Object.create(MathMock.oldMath);

  static setup() {
    global.Math = MathMock.newMath;
  }

  static teardown() {
    global.Math = MathMock.oldMath;
  }

  static fixRandom(num: number) {
    MathMock.newMath.random = () => num;
  }
}
