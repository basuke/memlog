import { hex, parse } from '../src/memlog';
import { Actions } from '../src/memlog/log';

const fs = require('fs');

const argv = require('minimist')(process.argv.slice(2));

function parseLogFile(path) {
    const source = fs.readFileSync(path).toString().substr(0, 10000);
    const logs = parse(source);
    return logs;
}

const path = argv._[0];
console.log(`parsing log file: ${path}`);
const logs = parseLogFile(path);

for (let i = 0; i < logs.length;  i++) {
    const log = logs[i];
    const nextLog = logs[i + 1];

    if (log.action === Actions.Begin || log.action === Actions.End) continue;

    if (log.layer === 'vm') {
        log.layer = 'mmap';
        if (log.action === Actions.Split) {
            if (nextLog.action === Actions.Free) {
                i++;
                log.action = Actions.Free;
                log.addr = nextLog.addr;
                log.line += "\n" + nextLog.line;
            }
        } else if (log.action === Actions.Alloc) {
            log.type = 'anon';
        }
    } else if (log.layer === 'page') {
        log.layer = 'mmap';
        if (log.action == Actions.Free) {
            log.action = Actions.Alloc;
            log.type = 'free';
        }
    }
    console.log(`${log.layer} ${log.action} 0x${hex(log.addr)} ${log.size ?? ''}`);
}

