import * as fs from 'fs';
import * as path from 'path';

export class FSPromise {
  static async isDirectory(filePath: string) {
    return new Promise(
      (
        resolve: (isDirectory: boolean) => void,
        reject: (reason: Error) => void
      ) => {
        fs.stat(
          filePath,
          (error: NodeJS.ErrnoException | null, stats: fs.Stats) => {
            if (error) {
              reject(error);
              return;
            }

            const isDirectory = stats.isDirectory();
            resolve(isDirectory);
            return;
          }
        );
      }
    );
  }

  static async listTree(filePath: string) {
    return new Promise(
      (resolve: (files: string[]) => void, reject: (reason: Error) => void) => {
        fs.readdir(
          filePath,
          async (error: NodeJS.ErrnoException | null, files: string[]) => {
            if (error) {
              reject(error);
              return;
            }

            const fileList: string[] = [];
            for (const file of files) {
              const fullFilepath = path.join(filePath, file);
              const isDirectory = await FSPromise.isDirectory(fullFilepath);
              if (!isDirectory) {
                fileList.push(fullFilepath);
              } else {
                const subfolderFiles = await FSPromise.listTree(fullFilepath);
                for (const subfolderFile of subfolderFiles) {
                  fileList.push(subfolderFile);
                }
              }
            }

            resolve(fileList);
            return;
          }
        );
      }
    );
  }
}
