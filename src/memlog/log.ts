export enum Actions {
    Alloc = 'alloc',
    Mod = 'mod',
    Split = 'split',
    Merge = 'merge',
    Free = 'free',
    Begin = 'begin',
    End = 'end',
};

export const actionMap = {
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

    clone() {
        const log = new Log(this.action);
        log.ts = this.ts;
        log.layer = this.layer;
        log.addr = this.addr;
        log.size = this.size;
        log.other = this.other;
        log.type = this.type;
        log.line = this.line;
        return log;
    }

    serialize(): string {
        return [
            this.action,
            this.ts,
            this.layer,
            this.addr,
            this.size ?? '',
            this.other ?? '',
            this.type ?? '',
            this.line
        ].join("\n");
    }

    static deseriarize(str: string): Log {
        const [action, ts, layer, addr, size, other, type, ...lines] = str.split("\n");
        const log = new Log(action);
        log.ts = parseInt(ts);
        log.layer = layer;
        log.addr = parseInt(addr);
        if (size.length) log.size = parseInt(size);
        if (other.length) log.other = parseInt(other);
        if (type.length) log.type = type;
        log.line = lines.join("\n");
        return log;
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

export function parseNum(value) {
    if (value === undefined) {
        return undefined;
    } else if (value.substr(0, 2) === '0x') {
        return parseInt(value.substr(2), 16);
    } else {
        return parseInt(value);
    }
}

export class LogParser {
    no = 0;
    remaining = '';
    comments = [];
    hasTid: boolean = false;

    constructor(flags: string[] = []) {
        this.hasTid = flags.includes('tid');
    }

    reset(): void {
        this.no = 0;
    }

    parseParams(log, parameters) {
        parameters.map(param => {
            const [key, value] = param.split(':');
            if (key === 'addr' || key === 'size' || key === 'other' || key === 'ts')
                log[key] = parseNum(value);
            else if (key === 'layer' || key === 'type')
                log[key] = value;
        });
    }

    parseLine(line: string): Log | undefined {
        const [action, ...parameters] = line.split(/ +/);
        const log =  new Log(action);
        this.parseParams(log, parameters);
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
                const lineWithNumber = `${this.no}: ${line}`;
    
                if (this.isComment(line)) {
                    this.comments.push(lineWithNumber);
                } else {
                    const log = this.parseLine(line.split('#')[0]);

                    log.line = [...this.comments, lineWithNumber].join("\n");
                    this.comments = [];

                    log.validate();
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

export class CompactLogParser extends LogParser {
    parseParams(log: Log, parameters) {
        log.ts = parseNum(parameters.shift());
        if (this.hasTid) parseNum(parameters.shift());
        log.layer = parameters.shift();
        log.addr = parseNum(parameters.shift());

        switch (log.action) {
            case Actions.Alloc:
                log.size = parseNum(parameters.shift());
                log.type = parameters.shift();
                break;

            case Actions.Split:
            case Actions.Free:
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
}

function chooseParser(firstLine: string): LogParser {
    // # memlog [compact,tid]
    const matched = firstLine.match(/^\# memlog .*\[(.*)\]/);
    if (!matched) return new LogParser();
    const flags = matched[1].split(',');

    return flags.includes('compact') ? new CompactLogParser(flags) : new LogParser(flags);
}

export function parse(source: string): Log[] {
    const firstLine = source.substr(0, source.indexOf("\n"));
    const parser = chooseParser(firstLine);
    return parser.parse(source);
}
