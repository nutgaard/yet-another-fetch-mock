import { vi } from 'vitest';

export default class ConsoleMock {
  private static oldConsole = global.console;
  private static newConsole = Object.create(ConsoleMock.oldConsole);

  static setup() {
    ConsoleMock.newConsole.trace = vi.fn();
    ConsoleMock.newConsole.debug = vi.fn();
    ConsoleMock.newConsole.log = vi.fn();
    ConsoleMock.newConsole.warn = vi.fn();
    ConsoleMock.newConsole.error = vi.fn();
    ConsoleMock.newConsole.group = vi.fn();
    ConsoleMock.newConsole.groupCollapsed = vi.fn();
    ConsoleMock.newConsole.groupEnd = vi.fn();

    global.console = ConsoleMock.newConsole;
  }

  static teardown() {
    global.console = ConsoleMock.oldConsole;
  }
}
