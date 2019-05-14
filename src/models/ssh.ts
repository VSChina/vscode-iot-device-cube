import { MoleHole } from 'molehole';
import * as ssh2 from 'ssh2';
import { EventEmitter } from 'events';
import { FSPromise as fs } from './fsPromise';
import * as path from 'path';

interface SSHClientList {
  total: number;
  clients: {
    [index: number]: ssh2.Client;
  };
}

export class SSH {
  private static _clientList: SSHClientList = {
    total: 0,
    clients: {},
  };

  private static _getClient(id: number) {
    return SSH._clientList.clients[id];
  }

  private static _removeClient(id: number) {
    delete SSH._clientList.clients[id];
  }

  static async discover() {
    const devices = MoleHole.getDevicesFromLAN();
    return devices;
  }

  static async open(
    host: string,
    port: number,
    username: string,
    password: string
  ) {
    return new Promise((resolve: (id: number) => void) => {
      const client = new ssh2.Client();
      client
        .on('ready', () => {
          SSH._clientList.clients[SSH._clientList.total] = client;
          SSH._clientList.total++;
          resolve(SSH._clientList.total - 1);
          return;
        })
        .connect({
          host,
          port,
          username,
          password,
        });
    });
  }

  static close(id: number) {
    const client = SSH._getClient(id);
    client.end();
    SSH._removeClient(id);
  }

  static spawn(id: number, command: string) {
    const event = new EventEmitter();
    const client = SSH._getClient(id);
    client.shell((error: Error, channel: ssh2.ClientChannel) => {
      if (error) {
        event.emit('error', error);
        return;
      }

      channel.on('close', () => {
        event.emit('close');
      });

      channel.on('data', (data: Buffer) => {
        event.emit('data', data.toString());
      });

      channel.stderr.on('data', (data: Buffer) => {
        event.emit('data', data.toString());
      });

      channel.setWindow(10, 500, 10, 100);

      channel.end(command + '\n');
    });

    return event;
  }

  static async exec(id: number, command: string) {
    return new Promise(
      (resolve: (output: string) => void, reject: (reason: Error) => void) => {
        let output = '';
        const cmd = SSH.spawn(id, command);

        cmd.on('data', (chunk: string) => {
          output += chunk;
        });

        cmd.on('close', () => {
          resolve(output);
          return;
        });

        cmd.on('error', (error: Error) => {
          reject(error);
          return;
        });
      }
    );
  }

  static async uploadFile(
    id: number,
    localPath: string,
    remoteFolderPath: string
  ) {
    return new Promise(
      (resolve: (value: void) => void, reject: (reason: Error) => void) => {
        const client = SSH._getClient(id);
        client.sftp(async (error: Error, sftp: ssh2.SFTPWrapper) => {
          if (error) {
            reject(error);
            return;
          }

          remoteFolderPath = remoteFolderPath
            .replace(/[\/\\]+/g, '/')
            .replace(/\/$/, '');
          let remotePath = path.join(
            remoteFolderPath,
            path.basename(localPath)
          );
          remotePath = remotePath.replace(/[\/\\]+/g, '/');
          await SSH.exec(id, `mkdir -p ${remoteFolderPath}`);

          sftp.fastPut(localPath, remotePath, (error: Error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
            return;
          });
        });
      }
    );
  }

  static async uploadFolder(
    id: number,
    localFolderPath: string,
    remoteFolderPath: string
  ) {
    return new Promise(
      async (
        resolve: (value: void) => void,
        reject: (reason: Error) => void
      ) => {
        try {
          localFolderPath = localFolderPath.replace(/[\/\\]+/g, '/');
          if (!/\/$/.test(localFolderPath)) {
            localFolderPath += '/';
          }
          const files = await fs.listTree(localFolderPath);

          for (const localPath of files) {
            const fileFolderPath = path
              .dirname(localPath)
              .replace(/[\/\\]+/g, '/');
            const relativePath = fileFolderPath.substr(localFolderPath.length);
            const remotePath = path.join(remoteFolderPath, relativePath);
            await SSH.uploadFile(id, localPath, remotePath);
          }

          resolve();
          return;
        } catch (error) {
          reject(error);
          return;
        }
      }
    );
  }
}
