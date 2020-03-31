import * as clipboardy from 'clipboardy';

export class Clipboard {
  static copy(text: string) {
    clipboardy.writeSync(text);
  }
}
