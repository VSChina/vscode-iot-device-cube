const impor = require('impor')(__dirname);

import * as vscode from 'vscode';

const filesystem = impor(
  './models/filesystem'
) as typeof import('./models/filesystem');

const ssh = impor('./models/ssh') as typeof import('./models/ssh');

export function activate(context: vscode.ExtensionContext) {
  const fsListVolume = vscode.commands.registerCommand(
    'iotcube.fsListVolume',
    async () => {
      return filesystem.FileSystem.listVolume();
    }
  );

  const fsCopyFile = vscode.commands.registerCommand(
    'iotcube.fsCopyFile',
    async (sourcePath: string, targetPath: string) => {
      return filesystem.FileSystem.copyFile(sourcePath, targetPath);
    }
  );

  const sshDiscover = vscode.commands.registerCommand(
    'iotcube.sshDiscover',
    async () => {
      return ssh.SSH.discover();
    }
  );

  const sshOpen = vscode.commands.registerCommand(
    'iotcube.sshOpen',
    async (host: string, port: number, username: string, password: string) => {
      return ssh.SSH.open(host, port, username, password);
    }
  );

  const sshClose = vscode.commands.registerCommand(
    'iotcube.sshClose',
    async (id: number) => {
      return ssh.SSH.close(id);
    }
  );

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

  const sshExec = vscode.commands.registerCommand(
    'iotcube.sshExec',
    async (id: number, command: string) => {
      return ssh.SSH.exec(id, command);
    }
  );

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

  context.subscriptions.push(fsListVolume);
  context.subscriptions.push(fsCopyFile);
  context.subscriptions.push(sshDiscover);
  context.subscriptions.push(sshOpen);
  context.subscriptions.push(sshClose);
  context.subscriptions.push(sshSpawn);
  context.subscriptions.push(sshExec);
  context.subscriptions.push(sshUploadFile);
  context.subscriptions.push(sshUploadFolder);
}

export function deactivate() {}
