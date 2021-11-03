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
        this.comments = [];

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

export class Memlog {
    history: RegionMap[];
    start: number;
    end: number;

    constructor() {
        this.history = [{}];
        this.start = undefined;
        this.end = undefined;
    }

    get length() {
        return this.history.length;
    }

    get latest(): RegionMap {
        return this.getRegions(this.history.length - 1);
    }

    getRegions(index): RegionMap {
        return this.history[index];
    }

    add(log: Log) {
        const prevRegions = this.latest;
        try {
            const regions = processLog(prevRegions, log);
            const [start, end] = calcRange(regions);

            if (this.length > 1) {
                this.start = Math.min(start, this.start);
                this.end = Math.max(end, this.end);
            } else {
                this.start = start;
                this.end = end;
            }
            this.history.push(regions);
        } catch (e) {
            console.error(e);
        }
    }
};

export function load(source): Memlog {
    let start = -1;
    let end = -1;

    const logs = parse(source);
    console.log(`${logs.length} lines of logs`, logs.splice(0, 10));

    return null;
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

    // return { history, logs,  length: history.length, address: { start, end } };
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
    region.type = log.type;
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
