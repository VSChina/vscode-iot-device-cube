import * as sp from 'serialport';
import { EventEmitter } from 'events';

export class SerialPort {
  private static _port: sp | null = null;

  static async list() {
    return sp.list();
  }

  static open(port: string, baudRate: number) {
    if (SerialPort._port !== null && SerialPort._port.isOpen) {
      throw new Error(
        'You must close current serial port before open a new one.'
      );
    }
    const event = new EventEmitter();
    SerialPort._port = new sp(port, { baudRate });
    SerialPort._port.on('open', () => {
      event.emit('opened');
    });
    SerialPort._port.on('data', (data: string) => {
      event.emit('data', data.toString());
    });
    SerialPort._port.on('error', (error: Error) => {
      event.emit('error', error);
    });
    SerialPort._port.on('close', () => {
      SerialPort._port = null;
      event.emit('closed');
    });
    SerialPort._port.on('drain', () => {
      event.emit('drain');
    });

    return event;
  }

  static async send(port: string, payload: string) {
    return new Promise(
      (resolve: (value: void) => void, reject: (reason: Error) => void) => {
        if (SerialPort._port === null || !SerialPort._port.isOpen) {
          const error = new Error(
            'You must open a serial port before send data.'
          );
          reject(error);
          return;
        }
        if (SerialPort._port.path !== port) {
          const error = new Error(`Serial port ${port} is not open.`);
          reject(error);
          return;
        }
        SerialPort._port.write(payload, (error: Error | null | undefined, bytesWritten: number) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
          return;
        });
      }
    );
  }

  static async close(port: string) {
    return new Promise((resolve: (value: void) => void) => {
      if (
        SerialPort._port &&
        SerialPort._port.isOpen &&
        SerialPort._port.path === port
      ) {
        SerialPort._port.close(() => {
          SerialPort._port = null;
          resolve();
          return;
        });
      } else {
        resolve();
        return;
      }
    });
  }
}
