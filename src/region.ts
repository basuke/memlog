import { Actions, Log } from "./memlog";

export type Region = {
    start: number;
    size?: number;
    end?: number;
    layer: string;
    type?: string;
    color?: string;
    logs?: string[];
};

export type RegionMap = Record<string, Region>;

function findRegion(regions: RegionMap, layer: string, addr: number): string | undefined {
    for (const key in regions) {
        const region = regions[key];
        if (region.layer === layer && region.start === addr) return key;
    }
    return undefined;
}

function getkey(region: Region): string {
    return region.layer + ':' + region.start;
}

function newRegion(log: Log): Region {
    const region = {
        layer: log.layer,
        start: log.addr,
        size: log.size,
        end: log.addr + log.size,
        logs: [log.line],
    };

    return modRegion(region, log);
}

function splitRegion(regions: RegionMap, region: Region, size: number): void {
    const remaining = region.size - size;
    if (size <= 0 || remaining <= 0) new Error("Cannot split with zero or negative size");

    const other = {...region, start: region.start + size, size: remaining, logs: [...region.logs]};

    region.size = size;
    region.end = region.start + size;

    regions[getkey(other)] = other;
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

export function processLog(regions: RegionMap, log: Log): RegionMap {
    regions = {...regions};
    const key = findRegion(regions, log.layer, log.addr);

    switch (log.action) {
        case Actions.Alloc:
            if (key) throw new Error("Region already exists");
            const region = newRegion(log);
            regions[getkey(region)] = region;
            break;

        default:
            if (!key) throw new Error(`Cannot find region with layer = ${log.layer} and start = ${log.addr}(0x${log.addr.toString(16)})`);

            regions[key].logs = [...regions[key].logs, log.line];
            const copy = {...regions[key]};

            switch (log.action) {
                case Actions.Free:
                    delete regions[key];
                    break;

                case Actions.Split:
                    splitRegion(regions, copy, log.size);
                    break;

                case Actions.Mod:
                    regions[key] = modRegion(copy, log);
                    break;

            }
            if (!key) throw new Error 
    }

    return regions;
}

export function calcRange(regions: RegionMap): [number, number] {
    const r = Object.values(regions);

    return r.length ? [
        Math.min(...r.map(r => r.start)),
        Math.max(...r.map(r => r.start + r.size)),
    ] : [0, 0];
}

export function layers(regions: RegionMap): string[] {
    const list = Object.values(regions).map(r => r.layer);
    return list.filter((item, index) => list.indexOf(item) === index);
}

export function rangesOfLayer(regions: RegionMap, layer: string): Region[] {
    return Object.values(regions).filter(region => region.layer == layer);
}
