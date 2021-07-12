import { crc8calculate } from "./crc8.js";

const CRC_FROM = 10;

class Command {
    protected _data: Buffer;

    public constructor() {
        /* eslint-disable @typescript-eslint/no-magic-numbers */
        this._data = Buffer.from([
            0xaa,
            // request is 0x20; setting is 0x23
            0x20,
            // device type
            0xac,
            0x00, 0x00, 0x00, 0x00, 0x00,
            0x00,
            // request is 0x03; setting is 0x02
            0x03,
            // Byte0 - Data request/response type: 0x41 - check status; 0x40 - Set up
            0x41,
            // Byte1
            0x81,
            // Byte2 - operational_mode
            0x00,
            // Byte3
            0xff,
            // Byte4
            0x03,
            // Byte5
            0xff,
            // Byte6
            0x00,
            // Byte7 - Room Temperature Request: 0x02 - indoor_temperature, 0x03 - outdoor_temperature
            // when set, this is swing_mode
            0x02,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            // Message ID
            0x00,
        ]);
        /* eslint-enable @typescript-eslint/no-magic-numbers */

        this._data[this._data.length - 1] = new Date().getSeconds();
    }

    public finalize() {
        const d = Buffer.concat([
            this._data,
            Buffer.from([crc8calculate(this._data.slice(CRC_FROM))]),
        ]);
        this._data = Buffer.concat([
            d,
            Buffer.from([Command.checksum(d.slice(1))]),
        ]);

        return this._data;
    }

    private static checksum(data: Buffer) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const byte = data.readUInt8(i);
            sum += byte;
        }
        sum = ~sum;
        sum += 1;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        return sum & 0xff;
    }
}

class SetCommand extends Command {
    public constructor() {
        super();
        this._data[0] = 0x0;
    }
}

export {
    Command,
    SetCommand,
};
