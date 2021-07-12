interface Options {
    id: number;
    host: string;
    port: number;
}

class Lan {
    private readonly _retries: number;

    private readonly _opts: Options;

    public constructor(opts: Options) {
        this._opts = opts;
        this._retries = 0;
    }
}

export {
    Lan,
};
