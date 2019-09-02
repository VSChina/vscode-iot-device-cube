export interface ComPort {
    comName: string,
    productId?: string,
    vendorId?: string
}

export interface PortListJson {
    portList: ComPort[]
}