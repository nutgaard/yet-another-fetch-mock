export default class ConsoleMock {
  private static oldConsole = global.console;
  private static newConsole = Object.create(ConsoleMock.oldConsole);

  static setup() {
    ConsoleMock.newConsole.trace = jest.fn();
    ConsoleMock.newConsole.debug = jest.fn();
    ConsoleMock.newConsole.log = jest.fn();
    ConsoleMock.newConsole.warn = jest.fn();
    ConsoleMock.newConsole.error = jest.fn();
    ConsoleMock.newConsole.group = jest.fn();
    ConsoleMock.newConsole.groupCollapsed = jest.fn();
    ConsoleMock.newConsole.groupEnd = jest.fn();

    global.console = ConsoleMock.newConsole;
  }

  static teardown() {
    global.console = ConsoleMock.oldConsole;
  }
}
