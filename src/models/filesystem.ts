import * as vscode from 'vscode';
import * as vl from 'volumelist';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class FileSystem {
  static async listVolume() {
    return vl.volumelistName();
  }

  static async copyFile(sourcePath: string, targetPath: string) {
    targetPath = path.join(targetPath, path.basename(sourcePath));
    fs.copyFile(sourcePath, targetPath, Promise.resolve);
  }

  static async transferFile(targetPath: string) {
    const stream = fs.createWriteStream(targetPath);
    const transferCallbackCommandName = `iotcube.transferfile${new Date().getTime()}_${Math.round(
      Math.random() * 100
    )}`;
    const transferCallback = vscode.commands.registerCommand(
      transferCallbackCommandName,
      async (base64Data: string) => {
        if (base64Data === 'EOF') {
          stream.end();
          transferCallback.dispose();
        } else {
          stream.write(base64Data, 'base64');
        }
      }
    );
    return transferCallbackCommandName;
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
