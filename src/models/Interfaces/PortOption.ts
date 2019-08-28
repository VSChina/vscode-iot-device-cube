export interface PortOption {
    baudRate: number | undefined;
    dataBits: number;
    stopBits: number;
    xon: boolean;
    xoff: boolean;
    parity: string;
}