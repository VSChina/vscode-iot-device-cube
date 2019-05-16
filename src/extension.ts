const impor = require('impor')(__dirname);

import * as vscode from 'vscode';

const filesystem = impor(
  './models/filesystem'
) as typeof import('./models/filesystem');

const ssh = impor('./models/ssh') as typeof import('./models/ssh');

// const serialport = impor(
//   './models/serialport'
// ) as typeof import('./models/serialport');

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

  const fsTransferFile = vscode.commands.registerCommand(
    'iotcube.fsTransferFile',
    (targetPath: string) => {
      return filesystem.FileSystem.transferFile(targetPath);
    }
  );

  const fsGetTempDir = vscode.commands.registerCommand(
    'iotcube.fsGetTempDir',
    async () => {
      return filesystem.FileSystem.getTempDir();
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

  // const serialportOpen = vscode.commands.registerCommand(
  //   'iotcube.serialpoartOpen',
  //   (port: string, baudRate: number, callbackCommand: string) => {
  //     const conn = serialport.SerialPort.open(port, baudRate);
  //     conn.on('opened', () => {
  //       try {
  //         vscode.commands.executeCommand(callbackCommand, 'opened');
  //       } catch (ignore) {}
  //     });

  //     conn.on('data', (chunk: string) => {
  //       try {
  //         vscode.commands.executeCommand(callbackCommand, 'data', chunk);
  //       } catch (ignore) {}
  //     });

  //     conn.on('error', (error: Error) => {
  //       try {
  //         vscode.commands.executeCommand(callbackCommand, 'error', error);
  //       } catch (ignore) {}
  //     });

  //     conn.on('closed', () => {
  //       try {
  //         vscode.commands.executeCommand(callbackCommand, 'closed');
  //       } catch (ignore) {}
  //     });

  //     conn.on('drain', () => {
  //       try {
  //         vscode.commands.executeCommand(callbackCommand, 'drain');
  //       } catch (ignore) {}
  //     });
  //   }
  // );

  // const serialportSend = vscode.commands.registerCommand(
  //   'iotcube.serialportSend',
  //   async (port: string, payload: string) => {
  //     serialport.SerialPort.send(port, payload);
  //   }
  // );

  // const serialportClose = vscode.commands.registerCommand(
  //   'iotcube.serialportClose',
  //   async (port: string) => {
  //     serialport.SerialPort.close(port);
  //   }
  // );

  context.subscriptions.push(fsListVolume);
  context.subscriptions.push(fsCopyFile);
  context.subscriptions.push(fsTransferFile);
  context.subscriptions.push(fsGetTempDir);
  context.subscriptions.push(sshDiscover);
  context.subscriptions.push(sshOpen);
  context.subscriptions.push(sshClose);
  context.subscriptions.push(sshSpawn);
  context.subscriptions.push(sshExec);
  context.subscriptions.push(sshUploadFile);
  context.subscriptions.push(sshUploadFolder);
  // context.subscriptions.push(serialportOpen);
  // context.subscriptions.push(serialportSend);
  // context.subscriptions.push(serialportClose);
}

export function deactivate() {}
