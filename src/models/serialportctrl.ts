import * as vscode from 'vscode';
import * as os from 'os';
import { PortOption } from './Interfaces/PortOption';
import { ComPort, PortListJson } from './Interfaces/PortListJson';

const SerialPort = require('node-usb-native').SerialPort;

interface SerialPortInfo {
  path: string;
  manufacturer: string;
  vendorId?: string;
  productId?: string;
}

/**
 * Control serialports on host machine.
 */
export class SerialPortCtrl {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _port: any;

  static getPlatform(): NodeJS.Platform {
    return os.platform();
  }

  /**
   * Get serialport list.
   */
  static async getComList(): Promise<PortListJson> {
    return new Promise((resolve: (value: PortListJson) => void, reject: (error: Error) => void) => {
      const portList: ComPort[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SerialPort.list((err: any, ports: SerialPortInfo[]) => {
        if (err) {
          reject(err);
        } else {
          ports.forEach((port) => {
            const com: ComPort = {
              path: port.path,
              productId: port.productId,
              vendorId: port.vendorId,
            };
            portList.push(com);
          });
          const portListJson = {
            portList,
          };
          resolve(portListJson);
        }
      });
    });
  }

  /**
   * Open a serialport and listen to its events.
   * @param comPort name of serialport.
   * @param option option of opening a serialport.
   */
  static async open(comPort: string, option: PortOption): Promise<void> {
    let monitorCallbackCommandName: string;
    try {
      monitorCallbackCommandName = (await vscode.commands.executeCommand(
        'iotworkbench.getMonitorCallbackCommandName'
      )) as string;
      if (!monitorCallbackCommandName) {
        throw new Error(`Fail to get iot workbench monitor callback command name`);
      }
      SerialPortCtrl._port = await new SerialPort(comPort, option);
    } catch (err) {
      throw err;
    }
    const errorPlaceHolder = new Error();
    const payloadPlaceHolder = '';
    SerialPortCtrl._port.on('open', async () => {
      try {
        await vscode.commands.executeCommand(
          monitorCallbackCommandName,
          'open',
          payloadPlaceHolder,
          errorPlaceHolder.message
        );
      } catch (err) {
        throw err;
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SerialPortCtrl._port.on('data', async (data: any) => {
      try {
        await vscode.commands.executeCommand(
          monitorCallbackCommandName,
          'data',
          data.toString(),
          errorPlaceHolder.message
        );
      } catch (err) {
        throw err;
      }
    });
    SerialPortCtrl._port.on('error', async (err: Error) => {
      try {
        vscode.commands.executeCommand(monitorCallbackCommandName, 'error', payloadPlaceHolder, err.message);
      } catch (err) {
        throw err;
      }
    });
    SerialPortCtrl._port.on('close', async () => {
      try {
        await vscode.commands.executeCommand(
          monitorCallbackCommandName,
          'close',
          payloadPlaceHolder,
          errorPlaceHolder.message
        );
      } catch (err) {
        throw err;
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    SerialPortCtrl._port.on('drain', () => {});
  }

  /**
   * Write data to serialport.
   * @param payload data to write.
   */
  static send(payload: string): Promise<void> {
    return new Promise((resolve: (value: void) => void, reject: (reason: Error) => void) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        SerialPortCtrl._port.write(payload, (err: any) => {
          if (err) {
            reject(err);
          } else {
            SerialPortCtrl._port.drain(() => resolve());
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static close(): Promise<void> {
    return new Promise((resolve: (value: void) => void, reject: (value: Error) => void) => {
      SerialPortCtrl._port.close((err: Error) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}
