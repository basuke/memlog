import { Log, Regions, parse } from './memlog';

const logPath = 'C:\\Users\\ysuzuki\\Downloads\\drive-download-20211104T225030Z-001\\memlog-62-11-03-23-57-32.log';
export let logs = parse(require('fs').readFileSync(logPath).toString()).filter(log => log.layer === 'bmalloc');
export let regions = new Regions();

export let healthCheck = () => {
    if (!regions.layers?.bmalloc) return;

    let lastRegion;
    for (const region of regions.layers.bmalloc.regions) {
        if (region.addr >= region.end) {
            throw new Error(`invalid region: addr 0x${region.addr}`);
        }
        if (lastRegion) {
            if (lastRegion.addr >= region.addr || lastRegion.end > region.addr) {
                throw new Error(`invalid regions: addr 0x${region.addr}`);
            }
        }
        lastRegion = region;
    }
};

export let step = () => {
    if (logs.length === 0) return null;
    regions = regions.process(logs[0]);
    healthCheck();
    logs.shift();
    return logs.length ? logs[0].line : null;
};

export let stepUntil = (condition: (log: Log) => boolean) => {
    while (logs.length) {
        step();
        if (logs.length && condition(logs[0])) return logs[0].line;
    }
};
