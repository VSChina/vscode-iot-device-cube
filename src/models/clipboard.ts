import * as copypaste from 'copy-paste';

export class Clipboard {
  static copy(text: string) {
    copypaste.copy(text);
  }
}
