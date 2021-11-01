import { calcRange, Region, RegionMap } from './region';

enum Actions {
    Alloc = 'alloc',
    Mod = 'mod',
    Split = 'split',
    Merge = 'merge',
    Free = 'free',
    Begin = 'begin',
    End = 'end',
};

export class Log {
    action: string = '';
    ts: number = 0;
    layer: string = '';
    addr: number = -1;
    size?: number;
    other?: number = -1;
    color?: string;
    type?: string;
    attrs: Record<string, string> = {};
    line?: string;

    constructor(action: string) {
        this.action = action;
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

export class Parser {
    no = 0;
    remaining = '';
    comments = [];

    reset(): void {
        this.no = 0;
    }

    parseLine(line: string): Log | undefined {
        const lineWithNumber = `${this.no}: ${line}`;
    
        if (this.isComment(line)) {
            this.comments.push(lineWithNumber);
            return undefined;
        }

        const [action, ...parameters] = line.split('#')[0].split(/ +/);
        const log = new Log(action);
        log.line = [...this.comments, lineWithNumber].join("\n");
        this.comments = [];

        parameters.map(param => {
            const [key, value] = param.split(':');
            if (key === 'addr' || key === 'size' || key === 'other' || key === 'ts')
                log[key] = eval(value);
            else if (key === 'layer' || key === 'type')
                log[key] = value;
            else
                log.attrs[key] = value;
        });

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

export type Memlog = {
    history: RegionMap[];
    logs: Log[];
    length: number;
    address: {
        start: number;
        end: number;
    };
};

export function load(source): Memlog {
    let start = -1;
    let end = -1;

    const logs = parse(source);
    const history = logs.reduce((history: RegionMap[], log: Log): RegionMap[] => {
        const prevRegions = history.length ? history[history.length - 1] : {};
        try {
            const regions = processLog(prevRegions, log);
            const range = calcRange(regions);
            start = start >= 0 ? Math.min(start, range[0]) : range[0];
            end = end >= 0 ? Math.max(end, range[1]) : range[1];
            return [...history, regions];
        } catch (e) {
            console.error(e);
            return history;
        }
    }, []);

    start = Math.max(start, 0);
    end = Math.max(end, 0);

    return { history, logs,  length: history.length, address: { start, end } };
}

function findRegion(map: RegionMap, layer: string, addr: number): string | undefined {
    const key = makekey(layer, addr);
    return (key in map) ? key : undefined;
}

function getkey(region: Region): string {
    return makekey(region.layer, region.addr);
}

function makekey(layer: string, addr: number): string {
    return layer + ':' + addr;
}

function newRegion(log: Log): Region {
    const region: Region = {
        layer: log.layer,
        addr: log.addr,
        size: log.size,
        end: log.addr + log.size,
        logs: [log.line],
    };

    return modRegion(region, log);
}

function splitRegion(regions: RegionMap, region: Region, size: number): void {
    const remaining = region.size - size;
    if (size <= 0 || remaining <= 0) throw new Error("Cannot split with zero or negative size");

    const other = {...region, addr: region.addr + size, size: remaining, logs: [...region.logs]};

    region.size = size;
    region.end = region.addr + size;

    regions[getkey(region)] = region;
    regions[getkey(other)] = other;
}

function mergeRegion(map: RegionMap, region: Region, otherAddr: number): void {
    const otherKey = findRegion(map, region.layer, otherAddr);
    if (!otherKey) throw new Error("Cannot find with marge target");

    const other = map[otherKey];
    if (region.end !== other.addr) {
        throw new Error("Cannot merge non-neighbors");
    }

    region.size += other.size;
    region.end = other.end;

    map[getkey(region)] = region;
    delete map[otherKey];
}

function modRegion(region: Region, log: Log): Region {
    if ('type' in log) {
        region.type = log.type;
    }

    if (log.attrs) {
        for (const key in log.attrs) {
            region[key] = log.attrs[key];
        }
    }
    return region;
}

export function processLog(map: RegionMap, log: Log): RegionMap {
    map = {...map};
    const key = findRegion(map, log.layer, log.addr);

    switch (log.action) {
        case Actions.Alloc:
            if (key) throw new Error("Region already exists");
            const region = newRegion(log);
            map[getkey(region)] = region;
            break;

        case Actions.Begin:
        case Actions.End:
            break;

        default:
            if (!key) throw new Error(`Cannot find region with layer = ${log.layer} and addr = ${log.addr}(0x${log.addr.toString(16)}) \n ${log.line}`);

            map[key].logs = [...map[key].logs, log.line];
            const copy = {...map[key]};

            switch (log.action) {
                case Actions.Free:
                    delete map[key];
                    break;

                case Actions.Split:
                    splitRegion(map, copy, log.size);
                    break;

                case Actions.Merge:
                    mergeRegion(map, copy, log.other);
                    break;

                case Actions.Mod:
                    map[key] = modRegion(copy, log);
                    break;

            }
    }

    return map;
}
