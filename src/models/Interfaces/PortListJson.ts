export interface ComPort {
  path: string;
  productId?: string;
  vendorId?: string;
}

export interface PortListJson {
  portList: ComPort[];
}
