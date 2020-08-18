import * as clipboardy from 'clipboardy';

export class Clipboard {
  static copy(text: string): void {
    clipboardy.writeSync(text);
  }
}
