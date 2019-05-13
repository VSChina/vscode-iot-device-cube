import * as vl from 'volumelist';
import * as fs from 'fs';
import * as path from 'path';

export class FileSystem {
  static async listVolume() {
    return vl.volumelistName();
  }

  static async copyFile(sourcePath: string, targetPath: string) {
    targetPath = path.join(targetPath, path.basename(sourcePath));
    fs.copyFile(sourcePath, targetPath, Promise.resolve);
  }
}
