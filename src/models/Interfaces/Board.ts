// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface BoardInstallation {
  additionalUrl: string;
  packageName: string;
  architecture: string;
}

export interface Board {
  name: string;
  id: string;
  detailInfo: string;
  defaultBaudRate?: number;
  vendorId?: string;
  productId?: string;
  exampleUrl?: string;
  helpUrl?: string;
  installation?: BoardInstallation;
}