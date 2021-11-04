export type Region = {
    addr: number;
    end: number;
    type?: string;
    // logs?: string[];
};

enum Actions {
    Alloc = 'alloc',
    Mod = 'mod',
    Split = 'split',
    Merge = 'merge',
    Free = 'free',
    Begin = 'begin',
    End = 'end',
};

const actionMap = {
    a: Actions.Alloc,
    s: Actions.Split,
    m: Actions.Merge,
    f: Actions.Free,
    t: Actions.Mod,
    b: Actions.Begin,
    e: Actions.End,

    alloc: Actions.Alloc,
    split: Actions.Split,
    merge: Actions.Merge,
    free: Actions.Free,
    mod: Actions.Mod,
    begin: Actions.Begin,
    end: Actions.End,
};
export class Log {
    action: string = '';
    ts: number = 0;
    layer: string = '';
    addr: number = -1;
    size?: number;
    other?: number = -1;
    type?: string;
    line?: string;

    constructor(action: string) {
        this.action = actionMap[action];
    }

    validate(): void {
        switch (this.action) {
            case Actions.Begin:
            case Actions.End:
                break;

            default:
                switch (this.action) {
                    case Actions.Alloc:
                    case Actions.Split:
                        if (!this.size)
                            throw new Error(`'size' is required for ${this.action}`);
                        break;

                    case Actions.Free:
                        if (this.size)
                            throw new Error(`'size' is not allowed for ${this.action}`);
                        break;

                    case Actions.Merge:
                        if (this.other < 0)
                            throw new Error(`'other' is required for ${this.action}`);
                        break;

                    case Actions.Mod:
                        break;

                    default:
                        throw new Error("Invalid action");
                }
        }
    }
};

function parseNum(value) {
    if (value === undefined) {
        return undefined;
    } else if (value.substr(0, 2) === '0x') {
        return parseInt(value.substr(2), 16);
    } else {
        return parseInt(value);
    }
}
export class Parser {
    no = 0;
    remaining = '';
    comments = [];

    reset(): void {
        this.no = 0;
    }

    parseLog(log, parameters) {
        parameters.map(param => {
            const [key, value] = param.split(':');
            if (key === 'addr' || key === 'size' || key === 'other' || key === 'ts')
                log[key] = parseNum(value);
            else if (key === 'layer' || key === 'type')
                log[key] = value;
        });
    }

    parseShortLog(log: Log, parameters) {
        log.ts = parseNum(parameters.shift());
        log.layer = parameters.shift();
        log.addr = parseNum(parameters.shift());

        switch (log.action) {
            case Actions.Alloc:
                log.size = parseNum(parameters.shift());
                log.type = parameters.shift();
                break;

            case Actions.Split:
                log.size = parseNum(parameters.shift());
                break;

            case Actions.Merge:
                log.other = parseNum(parameters.shift());
                break;

            case Actions.Mod:
                log.type = parameters.shift();
                break;
    
            }
    }

    parseLine(line: string): Log | undefined {
        const lineWithNumber = `${this.no}: ${line}`;
    
        if (this.isComment(line)) {
            this.comments.push(lineWithNumber);
            return undefined;
        }

        const [action, ...parameters] = line.split('#')[0].split(/ +/);
        const log =  new Log(action);
        if (action.length === 1) {
            this.parseShortLog(log, parameters);
        } else {
            this.parseLog(log, parameters);
        }

        log.line = [...this.comments, lineWithNumber].join("\n");
        this.comments = [];
        log.validate();
        return log;
    }

    isComment(line: string): boolean {
        return (line.length === 0 || line[0] === '#');
    }

    parse(source: string): Log[] {
        const logs = [];
        const lines = source.split("\n");
        if (lines.length == 1) {
            this.remaining += source;
            return [];
        }

        let remaining = this.remaining;
        this.remaining = lines.pop();

        for (let line of lines) {
            this.no++;
            line = (remaining + line).trim();
            remaining = '';

            try {
                const log = this.parseLine(line);
                if (log) {
                    logs.push(log);
                }
            } catch (e) {
                this.error(this.no, e, line);
            }
        }
        return logs;
    }

    error(no: number, error: string, line: string): void {
        console.warn(`memlog: ${error} at line ${no}: ${line}`);
    }
};

export function parse(source: string): Log[] {
    const parser = new Parser();
    return parser.parse(source);
}

interface StartEnd {
    addr: number;
    end: number;
};

function updateStartEnd(a: StartEnd, b: StartEnd) {
    if (a.addr === undefined) {
        a.addr = b.addr;
        a.end = b.end;
    } else {
        a.addr = Math.min(a.addr, b.addr);
        a.end = Math.max(a.end, b.end);
    }
}
export class Layer {
    name: string;
    regions: Region[] = [];
    addr: number = undefined;
    end: number = undefined;

    constructor(name: string) {
        this.name = name;
    }

    clone(): Layer {
        const layer = new Layer(this.name);
        layer.regions = [...this.regions];
        layer.addr = this.addr;
        layer.end = this.end;
        return layer;
    }

    get length(): number {
        return this.regions.length;
    }

    get empty(): boolean {
        return this.length === 0;
    }

    getRegion(index: number): Region {
        return this.regions[index];
    }

    copyRegion(index: number): Region {
        const region = this.regions[index];
        return { ...region };
    }

    insertPosition(addr: number): number {
        const regions = this.regions;
        const indexOf = (from: number, end: number): number => {
            if (from === end) return from;

            const pos = from + Math.floor((end - from) / 2);
            const region = regions[pos];
            const delta = addr - region.addr;
            if (!delta) return pos;
            if (delta < 0) return indexOf(from, pos);
            return indexOf(pos + 1, end);
        };
        return indexOf(0, regions.length);
    }

    indexOf(addr: number): number {
        const pos = this.insertPosition(addr);
        if (pos >= this.length) return -1;

        const region = this.regions[pos];
        if (region.addr !== addr) return -1;
        return pos;
    }

    alloc(addr: number, size: number, type: string, line: string): Layer {
        const pos = this.insertPosition(addr);
        const check = this.getRegion(pos);
        if (check && check.addr === addr) throw new Error("Region already exists");
        if (check && check.addr < addr) throw new Error("Invalid sort order");

        const region: Region = {
            addr,
            end: addr + size,
            type: type,
        };
    
        const layer = this.clone();
        updateStartEnd(layer, region);
        layer.regions.splice(pos, 0, region);
        return layer;
    }

    split(addr: number, size: number, line: string): Layer {
        const pos = this.indexOf(addr);
        if (pos < 0) throw new Error(`Cannot find region with layer = ${this.name} and addr = ${addr}(0x${addr.toString(16)})`);

        const first = this.copyRegion(pos);
        const next = this.copyRegion(pos);

        if (size <= 0 || (first.addr + size) >= first.end) throw new Error("Cannot split with invalid size ${size}");

        first.end = next.addr = first.addr + size;

        const layer = this.clone();
        layer.regions.splice(pos, 1, first, next);
        return layer;
    }

    merge(addr: number, other: number, line: string): Layer {
        const pos = this.indexOf(addr);
        if (pos < 0) throw new Error(`Cannot find region with layer = ${this.name} and addr = ${addr}(0x${addr.toString(16)})`);
        if (pos === this.length - 1) throw new Error(`Cannot merge last region`);

        const first = this.copyRegion(pos);
        const next = this.getRegion(pos + 1);
        if (next.addr != first.end) throw new Error(`Cannot merge non-neighbor regions`);

        first.end = next.end;

        const layer = this.clone();
        layer.regions.splice(pos, 2, first);
        return layer;
    }

    mod(addr: number, type: string, line: string): Layer {
        const pos = this.indexOf(addr);
        if (pos < 0) throw new Error(`Cannot find region with layer = ${this.name} and addr = ${addr}(0x${addr.toString(16)})`);

        const range = this.copyRegion(pos);
        range.type = type;

        const layer = this.clone();
        layer.regions.splice(pos, 1, range);
        return layer;
    }

    free(addr: number): Layer {
        const pos = this.indexOf(addr);
        if (pos < 0) throw new Error(`Cannot find region with layer = ${this.name} and addr = ${addr}(0x${addr.toString(16)})`);

        const layer = this.clone();
        layer.regions.splice(pos, 1);
        return layer;
    }
};

export class Regions {
    layers: Record<string, Layer> = {};
    addr: number = undefined;
    end: number = undefined;

    clone(): Regions {
        const regions = new Regions();
        regions.layers = {...this.layers};
        regions.addr = this.addr;
        regions.end = this.end;
        return regions;
    }

    process(log: Log): Regions {
        const layerName = log.layer;
        const regions = this.clone();

        let layer = (layerName in this.layers) ? regions.layers[layerName] : new Layer(layerName);

        switch (log.action) {
            case Actions.Alloc:
                layer = layer.alloc(log.addr, log.size, log.type, log.line);
                break;

            case Actions.Free:
                layer = layer.free(log.addr);
                break;

            case Actions.Split:
                layer = layer.split(log.addr, log.size, log.line);
                break;

            case Actions.Merge:
                layer = layer.merge(log.addr, log.other, log.line);
                break;

            case Actions.Mod:
                layer = layer.mod(log.addr, log.type, log.line);
                break;

            default: {
                return this;
            }
        }

        regions.layers[layerName] = layer;
        updateStartEnd(regions, layer);
        return regions;
    }
}
export class Memlog {
    history: Regions[] = [];
    addr: number;
    end: number;

    get length() {
        return this.history.length;
    }

    get latest(): Regions {
        return this.getRegions(this.length - 1);
    }

    getRegions(index): Regions {
        if (index < 0 || index >= this.length) return new Regions();
        return this.history[index];
    }

    process(log: Log) {
        const prevRegions = this.latest;
        try {
            const regions = prevRegions.process(log);
            updateStartEnd(this, regions);
            this.history.push(regions);
        } catch (e) {
            console.error(e);
            console.log(log.line);
        }
    }
};
