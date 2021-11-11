import { Log, parse } from './memlog';
import config from './configs/webkit.config';
import type { LayerConfig } from './memlog/config';
import { Actions } from './memlog/log';

console.log('Worker started.');

function layerConfigOf(log): LayerConfig|undefined {
    return config.layers[log.layer];
}

function mergeLogs(logs) {
    const result = [];
    let lastLog;
    for (const log of logs) {
        const merged = merge(lastLog, log);
        if (merged) {
            lastLog = merged;
        } else {
            if (lastLog) {
                result.push(lastLog);
            }
            lastLog = log;
        }
    }
    if (lastLog) {
        result.push(lastLog);
    }
    return result;
}

function merge(a: Log, b: Log): Log|undefined {
    if (!a || !b) return undefined;
    if (a.action != b.action || a.layer != b.layer) return undefined;
    if (a.action !== Actions.Alloc && a.action !== Actions.Free) return undefined;

    const result = a.clone();
    result.line += "\n" + b.line;

    if ((a.addr + a.size) === b.addr || (b.addr + b.size) === a.addr) {
        result.addr = Math.min(a.addr, b.addr);
        result.size = a.size + b.size;
        return result;
    } else {
        return undefined;
    }
}

onmessage = function(e) {
    console.log('Worker received message');
    const source = e.data;
    let logs = parse(source).filter(log => {
        const layerConfig = layerConfigOf(log);
        return (layerConfig && !layerConfig.disabled);
    }).slice(0, 10000);

    // logs = mergeLogs(logs);

    postMessage(logs.length);
    for (const log of logs) {
        postMessage(log.serialize());
    }
    postMessage(null);
};
