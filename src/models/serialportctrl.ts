import * as vscode from 'vscode';
import * as os from 'os';
import {PortOption} from './Interfaces/PortOption';
import {ComPort, PortListJson} from './Interfaces/PortListJson';

const SerialPort = require('../../vendor/node-usb-native').SerialPort;

interface SerialPortInfo {
  comName: string;
  manufacturer: string;
  vendorId?: string;
  productId?: string;
}

export class SerialPortCtrl {
  private static _port: any;

  static getPlatform() {
    return os.platform();
  }

  static async getComList(): Promise<PortListJson> {
    return new Promise(
      (
        resolve: (value: PortListJson) => void,
        reject: (error: Error) => void
      ) => {
        // tslint:disable-next-line: no-any
        var portList: ComPort[] = [];
        SerialPort.list((err: any, ports: SerialPortInfo[]) => {
          if (err) {
            reject(err);
          } else {
            ports.forEach( (port) => {
              const com: ComPort = {
                "comName": port.comName,
                "productId": port.productId,
                "vendorId": port.vendorId
              };
              portList.push(com);
            });
            const portListJson = {
              "portList": portList
            }
            resolve(portListJson);
          }
        });
      }
    );
  }

  static async open(comPort: string, option: PortOption) {
    let monitorCallbackCommandName: string;
    try {
      monitorCallbackCommandName = await vscode.commands.executeCommand(
        'iotworkbench.getMonitorCallbackCommandName'
      ) as string;
      SerialPortCtrl._port = await new SerialPort(comPort, option);
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