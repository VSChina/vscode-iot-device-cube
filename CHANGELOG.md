# Change Log

All notable changes to the "vscode-iot-device-cube" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Version 0.2.0

### Fixed

- Serialport unable to work on VS Code, Electron v7.[[#980](https://github.com/microsoft/vscode-arduino/issues/980)]
- glob not found issue.

## Version 0.1.4

### Fixed

- SSH.exec API exit properly after execute a command.

## Version 0.1.3

### Fixed

- Upload a folder from local file system to server through ssh.

## Version 0.1.2

### Added
By coorperating with Azure IoT Device Workbench's dependency [vscode-iot-device-cube-sdk (version 0.0.21)](https://www.npmjs.com/package/vscode-iot-device-cube-sdk), IoT Device Cube extension now is able to help Azure IoT Device Workbench extension to upload folder from container to device such as Raspberry Pi, and to config DevKit in a container. Related changes are listed as follows.

- Add command 'iotcube.unzipFile' to unzip a folder

- Add class of 'SerialPortCtrl' to control serialports on local machine

## Version 0.1.1

### Fixed

- Update extension logo

## Version 0.1.0

- Initial release