import { EventEmitter } from 'events';

interface SerialPortInfo {
  port: string;
  pid: number;
  vid: number;
}

export class SerialPort {
  static async list() {
    return new Promise(
      (
        resolve: (list: SerialPortInfo[]) => void,
        reject: (reason: Error) => void
      ) => {}
    );
  }

  static open(port: string) {
    const event = new EventEmitter();
  }

  static async send(port: string, payload: string | Buffer) {
    return new Promise(
      (resolve: (value: void) => void, reject: (reason: Error) => void) => {}
    );
  }

  static close(port: string) {}
}
