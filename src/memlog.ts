export enum Actions {
    Alloc = 'alloc',
    Mod = 'mod',
    Split = 'split',
    Free = 'free',
};

export class Log {
    action: string = '';
    ts: number = 0;
    layer: string = '';
    addr: number = -1;
    size?: number;
    color?: string;
    type?: string;
    attrs: Record<string, string> = {};
    line?: string;

    constructor(action: string) {
        this.action = action;
    }

    validate(): void {
        if (this.addr < 0) {
            throw new Error("'addr' is required");
        }

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

            case Actions.Mod:
                break;

            default:
                throw new Error("Invalid action");
        }
    }
};

export class Parser {
    no = 0;
    remaining = '';

    reset(): void {
        this.no = 0;
    }

    parseLine(line: string): Log | undefined {
        if (this.isComment(line)) return undefined;

        const [action, ...parameters] = line.split(/ +/);
        const log = new Log(action);
        log.line = `${this.no}: ${line}`;

        parameters.map(param => {
            const [key, value] = param.split(':');
            if (key === 'addr' || key === 'size' || key === 'ts')
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
