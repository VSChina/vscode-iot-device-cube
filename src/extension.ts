const impor = require('impor')(__dirname);

import * as vscode from 'vscode';
import * as path from 'path';
import { PortOption } from './models/Interfaces/PortOption';

const filesystem = impor('./models/filesystem') as typeof import('./models/filesystem');

const ssh = impor('./models/ssh') as typeof import('./models/ssh');

const clipboard = impor('./models/clipboard') as typeof import('./models/clipboard');

const serialport = impor('./models/serialportctrl') as typeof import('./models/serialportctrl');

export function activate(context: vscode.ExtensionContext): void {
  const serialportGetPlatform = vscode.commands.registerCommand('iotcube.serialportGetPlatform', () => {
    return serialport.SerialPortCtrl.getPlatform();
  });

  const serialportClose = vscode.commands.registerCommand('iotcube.serialportClose', () => {
    return serialport.SerialPortCtrl.close();
  });

  const serialportSend = vscode.commands.registerCommand('iotcube.serialportSend', (payload: string) => {
    return serialport.SerialPortCtrl.send(payload);
  });

  const serialportOpen = vscode.commands.registerCommand(
    'iotcube.serialportOpen',
    (comPort: string, option: PortOption) => {
      return serialport.SerialPortCtrl.open(comPort, option);
    }
  );

  const serialportGetComList = vscode.commands.registerCommand('iotcube.serialportGetComList', async () => {
    return serialport.SerialPortCtrl.getComList();
  });

  const fsListVolume = vscode.commands.registerCommand('iotcube.fsListVolume', async () => {
    return filesystem.FileSystem.listVolume();
  });

  const fsReadFile = vscode.commands.registerCommand(
    'iotcube.fsReadFile',
    async (localPath: string, encoding?: string) => {
      return filesystem.FileSystem.readFile(localPath, encoding);
    }
  );

  const fsCopyFile = vscode.commands.registerCommand(
    'iotcube.fsCopyFile',
    async (sourcePath: string, targetPath: string) => {
      return filesystem.FileSystem.copyFile(sourcePath, targetPath);
    }
  );

  const fsUnzipFile = vscode.commands.registerCommand('iotcube.unzipFile', (sourcePath: string, targetPath: string) => {
    return filesystem.FileSystem.unzipFile(sourcePath, targetPath);
  });

  const fsTransferFile = vscode.commands.registerCommand('iotcube.fsTransferFile', (targetPath: string) => {
    return filesystem.FileSystem.transferFile(targetPath);
  });

  const fsGetTempDir = vscode.commands.registerCommand('iotcube.fsGetTempDir', async () => {
    return filesystem.FileSystem.getTempDir();
  });

  const fsExists = vscode.commands.registerCommand('iotcube.fsExists', async (localPath: string) => {
    return filesystem.FileSystem.exists(localPath);
  });

  const fsIsDirectory = vscode.commands.registerCommand('iotcube.fsIsDirectory', async (localPath: string) => {
    return filesystem.FileSystem.isDirectory(localPath);
  });

  const fsIsFile = vscode.commands.registerCommand('iotcube.fsIsFile', async (localPath: string) => {
    return filesystem.FileSystem.isFile(localPath);
  });

  const fsMkDir = vscode.commands.registerCommand('iotcube.fsMkDir', async (localPath: string) => {
    return filesystem.FileSystem.mkDir(localPath);
  });

  const sshDiscover = vscode.commands.registerCommand('iotcube.sshDiscover', async () => {
    return ssh.SSH.discover();
  });

  const sshOpen = vscode.commands.registerCommand(
    'iotcube.sshOpen',
    async (host: string, port: number, username: string, password: string) => {
      return ssh.SSH.open(host, port, username, password);
    }
  );

  const sshClose = vscode.commands.registerCommand('iotcube.sshClose', async (id: number) => {
    return ssh.SSH.close(id);
  });

  const sshSpawn = vscode.commands.registerCommand(
    'iotcube.sshSpawn',
    async (id: number, command: string, callbackCommand: string) => {
      const process = await ssh.SSH.spawn(id, command);
      process.on('data', (chunk: string) => {
        try {
          vscode.commands.executeCommand(callbackCommand, 'data', chunk);
        } catch (ignore) {}
      });

      process.on('error', (error: Error) => {
        try {
          vscode.commands.executeCommand(callbackCommand, 'error', error);
        } catch (ignore) {}
      });

      process.on('close', () => {
        try {
          vscode.commands.executeCommand(callbackCommand, 'close');
        } catch (ignore) {}
      });
    }
  );

  const sshExec = vscode.commands.registerCommand('iotcube.sshExec', async (id: number, command: string) => {
    return ssh.SSH.exec(id, command);
  });

  const sshUploadFile = vscode.commands.registerCommand(
    'iotcube.sshUploadFile',
    async (id: number, localPath: string, remotePath: string) => {
      return ssh.SSH.uploadFile(id, localPath, remotePath);
    }
  );

  const sshUploadFolder = vscode.commands.registerCommand(
    'iotcube.sshUploadFolder',
    async (id: number, localFolderPath: string, remoteFolderPath: string) => {
      return ssh.SSH.uploadFolder(id, localFolderPath, remoteFolderPath);
    }
  );

  const openInContainer = vscode.commands.registerCommand('iotcube.openInContainer', async (localPath: string) => {
    const containerPath = `/workspaces/${path.basename(localPath)}`;
    const uri = vscode.Uri.parse(
      `vscode-remote://dev-container+${Buffer.from(localPath, 'utf8').toString('hex')}${containerPath}`
    );
    await vscode.commands.executeCommand('vscode.openFolder', uri);
    return;
  });

  const openLocally = vscode.commands.registerCommand(
    'iotcube.openLocally',
    async (localPath: string, openInNewWindow = false) => {
      await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(localPath), openInNewWindow);
      return;
    }
  );

  const localRequire = vscode.commands.registerCommand(
    'iotcube.localRequire',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (modId: string, memeber: string, args?: any[]) => {
      const m = await import(modId);
      if (args) {
        const res = await m[memeber].call(null, args);
        const type = typeof res;
        return JSON.stringify({ type, res });
      } else {
        const res = m[memeber];
        const type = typeof res;
        return JSON.stringify({ type, res });
      }
    }
  );

  const clipboardCopy = vscode.commands.registerCommand('iotcube.clipboardCopy', (text: string) => {
    clipboard.Clipboard.copy(text);
  });

  context.subscriptions.push(serialportGetPlatform);
  context.subscriptions.push(serialportClose);
  context.subscriptions.push(serialportSend);
  context.subscriptions.push(serialportOpen);
  context.subscriptions.push(serialportGetComList);
  context.subscriptions.push(fsListVolume);
  context.subscriptions.push(fsReadFile);
  context.subscriptions.push(fsCopyFile);
  context.subscriptions.push(fsUnzipFile);
  context.subscriptions.push(fsTransferFile);
  context.subscriptions.push(fsGetTempDir);
  context.subscriptions.push(fsExists);
  context.subscriptions.push(fsIsDirectory);
  context.subscriptions.push(fsIsFile);
  context.subscriptions.push(fsMkDir);
  context.subscriptions.push(sshDiscover);
  context.subscriptions.push(sshOpen);
  context.subscriptions.push(sshClose);
  context.subscriptions.push(sshSpawn);
  context.subscriptions.push(sshExec);
  context.subscriptions.push(sshUploadFile);
  context.subscriptions.push(sshUploadFolder);
  context.subscriptions.push(openInContainer);
  context.subscriptions.push(openLocally);
  context.subscriptions.push(localRequire);
  context.subscriptions.push(clipboardCopy);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {}
