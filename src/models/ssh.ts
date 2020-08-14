import { MoleHole, DeviceInfo } from 'molehole';
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

  private static _getClient(id: number): ssh2.Client {
    return SSH._clientList.clients[id];
  }

  private static _removeClient(id: number): void {
    delete SSH._clientList.clients[id];
  }

  /**
   * Discovers devices in LAN
   */
  static async discover(): Promise<DeviceInfo[]> {
    const devices = MoleHole.getDevicesFromLAN();
    return devices;
  }

  /**
   * Attempts to connect to a server.
   * @param host server ip
   * @param port server ssh port
   * @param username server username
   * @param password server password
   */
  static async open(host: string, port: number, username: string, password: string): Promise<number> {
    return new Promise((resolve: (id: number) => void, reject: (error: Error) => void) => {
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
    });
  }

  /**
   * Close ssh connection and release resource.
   * @param id SSH connection id
   */
  static close(id: number): void {
    const client = SSH._getClient(id);
    client.end();
    SSH._removeClient(id);
  }

  /**
   * Starts an interactive shell session on the server and execute a command
   * @param id SSH connection id
   * @param command command to execute on server
   */
  static spawn(id: number, command: string): EventEmitter {
    const event = new EventEmitter();
    const client = SSH._getClient(id);
    client.shell((error: Error | undefined, channel: ssh2.ClientChannel | undefined) => {
      if (error) {
        event.emit('error', error);
        return;
      }

      if (channel) {
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

        channel.end(command + '\nexit\n');
      }
    });

    return event;
  }

  /**
   * Execute a command on server via a given ssh connection.
   * @param id SSH connection id
   * @param command Command to execute on server
   */
  static async exec(id: number, command: string): Promise<string> {
    return new Promise((resolve: (output: string) => void, reject: (reason: Error) => void) => {
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
    });
  }

  /**
   * Ensure directory exists on server. Create one if not exists.
   * @param sftp SFTP wrapper
   * @param remotePath folder path on server
   */
  private static async ensureFolder(sftp: ssh2.SFTPWrapper, remotePath: string): Promise<void> {
    return new Promise((resolve: (value: void) => void, reject: (error: Error) => void) => {
      sftp.readdir(remotePath, (error: Error | undefined) => {
        if (error) {
          sftp.mkdir(remotePath, (error: Error | undefined) => {
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
    });
  }

  /**
   * Upload a file from local file system to server through ssh.
   * @param id SSH connection id
   * @param localPath File directory on local file system
   * @param targetPath target folder path on server
   */
  static async uploadFile(id: number, localPath: string, targetPath: string): Promise<void> {
    return new Promise((resolve: (value: void) => void, reject: (reason: Error) => void) => {
      const client = SSH._getClient(id);
      client.sftp(async (error: Error | undefined, sftp: ssh2.SFTPWrapper | undefined) => {
        if (error) {
          reject(error);
          return;
        }
        if (!sftp) {
          reject(new Error('cannot get client sftp'));
          return;
        }

        targetPath = targetPath.replace(/[\\]+/g, path.posix.sep).replace(/\/$/, '');
        const remotePath = path.posix.join(targetPath, path.basename(localPath));

        await SSH.ensureFolder(sftp, targetPath);
        sftp.fastPut(localPath, remotePath, (error: Error | undefined) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
          return;
        });
      });
    });
  }

  /**
   * Upload a folder from local file system to server through ssh.
   * @param id SSH connection id
   * @param localFolderPath Folder path on local file system
   * @param targetPath Target folder path on server
   */
  static async uploadFolder(id: number, localFolderPath: string, targetPath: string): Promise<void> {
    return new Promise(async (resolve: (value: void) => void, reject: (reason: Error) => void) => {
      try {
        // Normalize path seperator to posix style
        localFolderPath = localFolderPath.replace(/[\\]+/g, path.posix.sep);
        if (!localFolderPath.endsWith(path.posix.sep)) {
          localFolderPath += path.posix.sep;
        }

        const client = SSH._getClient(id);

        // Clean and create the target path if not exists.
        const cmd = `rm -rf ${targetPath} && mkdir -p ${targetPath}`;
        client.exec(cmd, (err, stream) => {
          if (err) {
            throw err;
          }
          if (!stream) {
            throw new Error('cannot valid client channel');
          }
          stream
            .on('close', () => {
              client.sftp(async (error: Error | undefined, sftp: ssh2.SFTPWrapper | undefined) => {
                if (error) {
                  reject(error);
                  return;
                }
                if (!sftp) {
                  reject(new Error('can not get valid sftp wrapper'));
                  return;
                }

                const files = await fs.listTree(localFolderPath);

                for (let i = 0; i < files.length; i++) {
                  let filePath = files[i];
                  filePath = filePath.replace(/[\\]+/g, path.posix.sep).replace(/\/$/, '');
                  const relativePath = path.posix.relative(localFolderPath, filePath);
                  const remotePath = path.posix.join(targetPath, relativePath);

                  const remoteFolderPath = path.posix.dirname(remotePath);
                  await SSH.ensureFolder(sftp, remoteFolderPath).catch((error: Error) => {
                    sftp.end();
                    reject(error);
                    return;
                  });

                  sftp.fastPut(filePath, remotePath, (error: Error | undefined) => {
                    if (error) {
                      sftp.end();
                      reject(error);
                      return;
                    }
                    if (i === files.length - 1) {
                      sftp.end();
                      resolve();
                      return;
                    }
                  });
                }
              });
            })
            .on('data', (data: string) => {
              console.log('STDOUT: ' + data);
            })
            .stderr.on('data', (data: string) => {
              console.log('STDERR: ' + data);
            });
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }
}
