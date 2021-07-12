import udp from "dgram";

import { DeviceConfigError, ensureError } from "./errors.js";
import { decrypt } from "./security.js";

/* eslint-disable @typescript-eslint/no-magic-numbers */

const BROADCAST_MSG = Buffer.from([
    0x5a, 0x5a, 0x01, 0x11, 0x48, 0x00, 0x92, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x7f, 0x75, 0xbd, 0x6b, 0x3e, 0x4f, 0x8b, 0x76,
    0x2e, 0x84, 0x9c, 0x6e, 0x57, 0x8d, 0x65, 0x90,
    0x03, 0x6e, 0x9d, 0x43, 0x42, 0xa5, 0x0f, 0x1f,
    0x56, 0x9e, 0xb8, 0xec, 0x91, 0x8e, 0x92, 0xe5,
]);
const V2PLUS_DATA_LENGTH = 104;
const HEADER_ONE = "5a5a";
const HEADER_TWO = "8370";

const VERSION_LOCATION_ONE = [0, 2];
const VERSION_LOCATION_TWO = [8, 10];
const ID_LOCATION = [20, 26];

const DATA_PADDING = [8, -16]; // if version is in location two then data is padded;
const ENCRYPTED_DATA_PADDING = [40, -16];
const PORT_LOCATION = [4, 8];
const SERIAL_LOCATION = [8, 40];
const SSID_LOCATION = 41;
const SSID_LENGTH_LOCATION = 40;

const DATA_TIMEOUT = 5000;

/* eslint-enable @typescript-eslint/no-magic-numbers */

interface Options {
    port: number;
    host: string;
}

interface DevConfig {
    id: number;
    ip: string;
    port: number;
    serial: string;
    type: string;
    version: string;
    ssid: string;
}

class DeviceConfig {
    private readonly _opts: Options;

    public constructor(opts: Options) {
        this._opts = opts;
    }

    private static getId(id: Buffer) {
        return id.readUIntLE(0, id.length);
    }

    private static decodePort(rawData: Buffer) {
        return rawData.readUIntLE(0, rawData.length);
    }

    public get(): Promise<DevConfig> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => { reject(new Error("Timeout")); }, DATA_TIMEOUT);
        });

        const dataPromise = new Promise<DevConfig>((resolve, reject) => {
            const _sock = udp.createSocket("udp4");
            _sock.on("message", this._onData.bind(null, resolve, reject));
            _sock.send(BROADCAST_MSG, this._opts.port, this._opts.host, err => {
                if (err) {
                    reject(ensureError(err));
                }
            });
        });
        // @TODO properly end the socket and listening on resolve/reject

        return Promise.race([
            dataPromise,
            timeoutPromise,
        ]);
    }

    // eslint-disable-next-line max-statements
    private _onData(resolve: (value: DevConfig) => void, reject: (e: Error) => void, rawData: Buffer) {
        let data = rawData,
            version = "unknown",
            ip = "unknown",
            port = -1,
            serial = "unknown",
            ssid = "unknown",
            type = "unknown",
            id = -1;

        const isV2 = data.slice(...VERSION_LOCATION_ONE).toString("hex") === HEADER_ONE;
        const isVUnknown = data.slice(...VERSION_LOCATION_TWO).toString("hex") === HEADER_ONE;

        if (data.length >= V2PLUS_DATA_LENGTH && (isV2 || isVUnknown)) {
            if (isV2) {
                version = "V2";
            }
            if (data.slice(...VERSION_LOCATION_ONE).toString("hex") === HEADER_TWO) {
                version = "V3";
            }

            if (data.slice(...VERSION_LOCATION_TWO).toString("hex") === HEADER_ONE) {
                data = rawData.slice(DATA_PADDING[0], rawData.length + DATA_PADDING[1]);
            }

            id = DeviceConfig.getId(data.slice(...ID_LOCATION));
            const encryptedData = data.slice(ENCRYPTED_DATA_PADDING[0], data.length + ENCRYPTED_DATA_PADDING[1]);
            const reply = decrypt(encryptedData);
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            ip = [reply.readUInt8(3), reply.readUInt8(2), reply.readUInt8(1), reply.readUInt8(0)].join(".");

            port = DeviceConfig.decodePort(reply.slice(...PORT_LOCATION));
            serial = reply.slice(...SERIAL_LOCATION).toString("utf-8");
            ssid = reply.slice(SSID_LOCATION, SSID_LOCATION + reply.readUInt8(SSID_LENGTH_LOCATION)).toString("utf-8");
            type = ssid.split("_")[1];
        }

        const result = {
            id,
            ip,
            port,
            serial,
            type,
            version,
            ssid,
        };

        if (version === "unknown") {
            reject(new DeviceConfigError("Can't recognize this device", result));
            return;
        }

        resolve(result);
    }
}

export {
    DeviceConfig,
};

export type {
    DevConfig,
};
