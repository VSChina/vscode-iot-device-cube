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
    return new Promise(
      (resolve: (id: number) => void, reject: (error: Error) => void) => {
        const client = new ssh2.Client();
        client
          .on('ready', () => {
            SSH._clientList.clients[SSH._clientList.total] = client;
            SSH._clientList.total++;
            resolve(SSH._clientList.total - 1);
            return;
          })
          .on('error', (error: Error) => {
            reject(error);
            return;
          })
          .connect({
            host,
            port,
            username,
            password,
          });
      }
    );
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

        cmd.once('close', () => {
          cmd.removeAllListeners();
          resolve(output);
          return;
        });

        cmd.once('error', (error: Error) => {
          cmd.removeAllListeners();
          reject(error);
          return;
        });
      }
    );
  }

  private static async ensureFolder(
    sftp: ssh2.SFTPWrapper,
    remotePath: string
  ) {
    return new Promise(
      (resolve: (value: void) => void, reject: (error: Error) => void) => {
        sftp.readdir(remotePath, (error: Error) => {
          if (error) {
            sftp.mkdir(remotePath, (error: Error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
              return;
            });
          } else {
            resolve();
            return;
          }
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

          await SSH.ensureFolder(sftp, remoteFolderPath);
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

  /**
   * Upload an entire folder from local file system to target machine through ssh.
   * @param id SSH client connection id
   * @param localFolderPath Folder path on local file system.
   * @param targetPath Target folder path on target machine.
   */

  static async uploadFolder(
    id: number,
    localFolderPath: string,
    targetPath: string
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

          const client = SSH._getClient(id);

          // Clean and create the target path if not exists.
          const cmd = `rm -rf ${targetPath} && mkdir -p ${targetPath}`;
          client.exec(cmd, (err: Error, channel: ssh2.ClientChannel) => {});

          client.sftp(async (error: Error, sftp: ssh2.SFTPWrapper) => {
            if (error) {
              reject(error);
              return;
            }

            const files = await fs.listTree(localFolderPath);

            for (const filePath of files) {
              const fileFolderPath = path
                .dirname(filePath)
                .replace(/[\/\\]+/g, '/');
              const relativePath = fileFolderPath.substr(
                localFolderPath.length
              );
              let remoteFolderPath = path.join(targetPath, relativePath);

              remoteFolderPath = remoteFolderPath
                .replace(/[\/\\]+/g, '/')
                .replace(/\/$/, '');
              let remotePath = path.join(
                remoteFolderPath,
                path.basename(filePath)
              );
              remotePath = remotePath.replace(/[\/\\]+/g, '/');

              await SSH.ensureFolder(sftp, remoteFolderPath);
              sftp.fastPut(filePath, remotePath, (error: Error) => {
                if (error) {
                  reject(error);
                  return;
                }
              });
            }

            sftp.end();

            resolve();
            return;
          });
        } catch (error) {
          reject(error);
          return;
        }
      }
    );
  }
}
