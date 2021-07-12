import type { Command } from "./Command";

interface Opts {
    hexId: string;
}

class PacketBuilder {
    private readonly _opts: Opts;

    private readonly _packet: Buffer;

    private _command: Buffer | null;

    public constructor(opts: Opts) {
        this._opts = opts;

        this._command = null;
        /* eslint-disable @typescript-eslint/no-magic-numbers */
        this._packet = Buffer.concat([
            Buffer.from([
                // 2 bytes - StaticHeader
                0x5a, 0x5a,
                // 2 bytes - mMessageType
                0x01, 0x11,
                // 2 bytes - PacketLength
                0x00, 0x00,
                // 2 bytes
                0x20, 0x00,
                // 4 bytes - MessageId
                0x00, 0x00, 0x00, 0x00,
            ]),

            // 8 bytes - Date&Time
            PacketBuilder.dateTime(),
            // 6 bytes - mDeviceID
            this.deviceId(),

            Buffer.from([
                // 14 bytes
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]),
        ]);
        /* eslint-enable @typescript-eslint/no-magic-numbers */
    }

    public setCommand(command: Command) {
        this._command = command.finalize();
    }

    public finalize() {
        // encrypt
        // set packet length
        // extend
    }

    private deviceId() {
        return Buffer.from(this._opts.hexId, "hex");
    }

    private static dateTime() {
        const d = new Date();
        /* eslint-disable @typescript-eslint/no-magic-numbers */
        const t = `${d.getFullYear()}`
            + `${String(d.getMonth() + 1).padStart(2, "0")}`
            + `${String(d.getDate()).padStart(2, "0")}`
            + `${String(d.getHours()).padStart(2, "0")}`
            + `${String(d.getMinutes()).padStart(2, "0")}`
            + `${String(d.getSeconds()).padStart(2, "0")}`
            + `${String(d.getMilliseconds()).padStart(3, "0")}`.substring(0, 2);
        /* eslint-enable @typescript-eslint/no-magic-numbers */

        const parts = t.match(/.{1,2}/g);
        parts!.reverse();
        return Buffer.concat(parts!.map(p => {
            return Buffer.from([Number(p)]);
        }));
    }
}

export {
    PacketBuilder,
};
