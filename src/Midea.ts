import type { DevConfig } from "./deviceConfig.js";
import { DeviceConfig } from "./deviceConfig.js";
import { Lan } from "./Lan.js";
import { Command } from "./Command.js";
import { PacketBuilder } from "./PacketBuilder.js";

interface Options {
    port: number;
    host: string;
}

const HEX = 16;

class Midea {
    private readonly _opts: Options;

    private _deviceConfig: DevConfig | null;

    private _initialized: boolean;

    private _lan: Lan | null;

    private _hexId: string | null;

    public constructor(opts: Options) {
        this._opts = opts;
        this._deviceConfig = null;

        this._initialized = false;
        this._lan = null;
        this._hexId = null;
    }

    public async init() {
        await this._getDeviceConfig();
        const result = this._initFinal();
        this._initialized = true;

        return result;
    }

    private static getHexId(id: number) {
        let hs = id.toString(HEX);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (hs.length % 2 !== 0) {
            hs = "0" + hs;
        }
        return Buffer.from(hs, "hex").reverse().toString("hex");
    }

    private async _getDeviceConfig() {
        if (this._deviceConfig) {
            return this._deviceConfig;
        }

        const dc = new DeviceConfig(this._opts);
        const d = await dc.get();
        this._deviceConfig = d;
        return d;
    }

    private _initFinal() {
        const dc = this._deviceConfig!;
        this._hexId = Midea.getHexId(dc.id);

        this._lan = new Lan({
            port: dc.port,
            host: dc.ip,
            id: dc.id,
        });

        return this.refresh();
    }

    public refresh() {
        const cmd = new Command();
        const packet = new PacketBuilder({ hexId: this._hexId! });
        packet.setCommand(cmd);
        packet.finalize();

        return {
            x: true,
        };
    }
}

export {
    Midea,
};
