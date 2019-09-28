import * as vscode from 'vscode';
import * as vl from 'volumelist';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as util from 'util';
import * as AdmZip from 'adm-zip';

export class FileSystem {
  /**
   * Unzip file.
   * @param sourcePath path of folder to unzip.
   * @param targetPath path to save the generated uncompressed folder.
   */
  static async unzipFile(sourcePath: string, targetPath: string){
    return new Promise(
      async (resolve: (value: void) => void, reject: (error: Error) => void) => {
        try {
          // Extract archives
          const zip = new AdmZip(sourcePath);
          const extractAllToAsyncPromisify = util.promisify(zip.extractAllToAsync);
          await extractAllToAsyncPromisify(targetPath, true);
        } catch (err) {
          reject(err);
          return;
        }
        try {
          // Delete compressed folder on local machine.
          const unlinkPromisify = util.promisify(fs.unlink);
          await unlinkPromisify(sourcePath);
        } catch (err) {
          // This error does not affect folder-transfer so it does not invoke reject
          console.log("Failed to delete compressed folder on local machine: " + err);
        }
        resolve();
      }
    );
  }

  /**
   * Get an array of volumes (path, name) on host machine. 
   * Sample volume: Path "C:", name "OSDisk".
   */
  static async listVolume() {
    return vl.volumelistName();
  }

  static async readFile(localPath: string, encoding?: string) {
    return new Promise(
      (
        resolve: (data: string) => void,
        reject: (reason: Error | null) => void
      ) => {
        fs.readFile(
          localPath,
          encoding,
          (error: Error | null, data: string | Buffer) => {
            if (error) {
              reject(error);
              return;
            }
            if (typeof data === 'string') {
              data = Buffer.from(data);
            }
            resolve(data.toString('base64'));
            return;
          }
        );
      }
    );
  }

  static async copyFile(sourcePath: string, targetPath: string) {
    targetPath = path.join(targetPath, path.basename(sourcePath));
    fs.copyFile(sourcePath, targetPath, Promise.resolve);
  }

  static async transferFile(targetPath: string) {
    // const stream = fs.createWriteStream(targetPath);
    let buffer = Buffer.from([]);
    const transferCallbackCommandName = `iotcube.transferfile${new Date().getTime()}_${Math.round(
      Math.random() * 100
    )}`;
    const transferCallback = vscode.commands.registerCommand(
      transferCallbackCommandName,
      async (base64Data: string) => {
        return new Promise(
          (resolve: (value: void) => void, reject: (reason: Error) => void) => {
            if (base64Data === 'EOF') {
              transferCallback.dispose();
              // stream.end(Promise.resolve);
              fs.writeFile(targetPath, buffer, 'binary', error => {
                if (error) {
                  reject(error);
                  return;
                }
                resolve();
              });
            } else {
              // stream.write(base64Data, 'base64', Promise.resolve);
              buffer = Buffer.concat([
                buffer,
                Buffer.from(base64Data, 'base64'),
              ]);
              resolve();
            }
          }
        );
      }
    );
    return transferCallbackCommandName;
  }

  static async exists(localPath: string) {
    return new Promise((resolve: (exist: boolean) => void) => {
      fs.stat(localPath, (error: Error | null) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(true);
        return;
      });
    });
  }

  static async isDirectory(localPath: string) {
    return new Promise((resolve: (isDirectory: boolean) => void) => {
      fs.stat(localPath, (error: Error | null, stat: fs.Stats) => {
        if (error) {
          resolve(false);
          return;
        }

        resolve(stat.isDirectory());
        return;
      });
    });
  }

  static async isFile(localPath: string) {
    return new Promise((resolve: (isDirectory: boolean) => void) => {
      fs.stat(localPath, (error: Error | null, stat: fs.Stats) => {
        if (error) {
          resolve(false);
          return;
        }

        resolve(stat.isFile());
        return;
      });
    });
  }

  static async mkDir(localPath: string) {
    return new Promise(
      (resolve: (value: void) => void, reject: (error: Error) => void) => {
        fs.mkdir(localPath, (error: Error | null) => {
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

  static async getTempDir() {
    return new Promise(
      (resolve: (folder: string) => void, reject: (error: Error) => void) => {
        fs.mkdtemp(
          path.join(os.tmpdir(), 'iotcube-'),
          (error: NodeJS.ErrnoException | null, folder: string) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(folder);
            return;
          }
        );
      }
    );
  }
}
