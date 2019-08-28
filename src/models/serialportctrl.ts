import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as os from 'os';
import {Board} from './Interfaces/Board';
import {PortOption} from './Interfaces/PortOption';

const serialport = require('../../vendor/node-usb-native').SerialPort;

interface SerialPortInfo {
  comName: string;
  manufacturer: string;
  vendorId: string;
  productId: string;
}

export class SerialPortCtrl {
  private static _port: any;

  static getPlatform() {
    return os.platform();
  }

  static getComList(): Promise<SerialPortInfo[]> {
    return new Promise(
      (
        resolve: (value: SerialPortInfo[]) => void,
        reject: (error: Error) => void
      ) => {
        // tslint:disable-next-line: no-any
        serialport.list((err: any, ports: SerialPortInfo[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(ports);
          }
        });
      }
    );
  }

  static async chooseCOM(board: Board | undefined): Promise<string> {
    return new Promise(
      async (
        resolve: (value: string) => void,
        reject: (reason: Error) => void
      ) => {
        let comList;
        try{
          comList = await SerialPortCtrl.getComList();
        } catch (err) {
          return reject(err);
        }

        const az3166 = board;

        if (!az3166) {
          return reject(new Error('AZ3166 is not found in the board list.'));
        }

        const list = _.filter(comList, com => {
          if (com.vendorId && com.productId && az3166.vendorId &&
            az3166.productId &&
            com.vendorId.toLowerCase().endsWith(az3166.vendorId) &&
            com.productId.toLowerCase().endsWith(az3166.productId)) {
            return true;
          } else {
            return false;
          }
        });

        if (list && list.length) {
          let comPort = list[0].comName;
          if (list.length > 1) {
            // TODO: select com port from list when there are multiple AZ3166
            // boards connected
            comPort = list[0].comName;
          }

          if (!comPort) {
            reject(new Error('No avalible COM port.'));
          }

          resolve(comPort);
        } else {
          reject(new Error('No AZ3166 board connected.'));
        }
      }
    );
  }

  static async open(comPort: string, option: PortOption) {
    let monitorCallbackCommandName: string;
    try {
      monitorCallbackCommandName = await vscode.commands.executeCommand(
        'iotworkbench.getMonitorCallbackCommandName'
      ) as string;
      SerialPortCtrl._port = await new serialport(comPort, option);
    } catch (err) {
      throw err;
    }
    const errorPlaceHolder = new Error();
    const payloadPlaceHolder = "";
    SerialPortCtrl._port.on('open', async () => {
      try {
        await vscode.commands.executeCommand(
          monitorCallbackCommandName, 'open', payloadPlaceHolder, errorPlaceHolder.message
        );
      } catch (err) {
        throw err;
      }
    });
    SerialPortCtrl._port.on('data', async (data: any) => {
      try {
        await vscode.commands.executeCommand(
          monitorCallbackCommandName, 'data', data.toString(), errorPlaceHolder.message
        );
      } catch (err) {
        throw err;
      }
    });
    SerialPortCtrl._port.on('error', async (err: Error) => {
      try {
        vscode.commands.executeCommand(
          monitorCallbackCommandName, 'error', payloadPlaceHolder, err.message
        );
      } catch (err) {
        throw err;
      }
    });
    SerialPortCtrl._port.on('close', async () => {
      try {
        await vscode.commands.executeCommand(
          monitorCallbackCommandName, 'close', payloadPlaceHolder, errorPlaceHolder.message
        );
      } catch (err) {
        throw err;
      }
    });
    SerialPortCtrl._port.on('drain', () => {
    });
  }

  static send(payload: string) {
    return new Promise(
      (
        resolve: (value: void) => void, 
        reject: (reason: Error) => void
      ) => {
        try {
          // tslint:disable-next-line: no-any
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
      }
    );
  }

  static close() {
    return new Promise(
      (
        resolve: (value: void) => void,
        reject: (value: Error) => void
      ) => {
        SerialPortCtrl._port.close((err: Error) => {
          if(err){
            reject(err);
            return;
          }
          resolve();
        });
      }
    );
  }
  
}