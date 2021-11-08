import { Actions, Log } from "./log";

export type Region = {
    addr: number;
    end: number;
    type?: string;
    // logs?: string[];
};

export function intersect(a: Region, b: Region): Region|null {
    if (a.end <= b.addr || b.end <= a.addr) return null;
    const addr = Math.max(a.addr, b.addr);
    const end = Math.min(a.end, b.end);
    return { addr, end, type: a.type };
}

export function subtract(a: Region, b: Region): Region[] {
    const i = intersect(a, b);
    if (!i) return [{...a}];

    const type = a.type;
    return [
        { addr: a.addr, end: i.addr, type },
        { addr: i.end, end: a.end, type },
    ].filter(r => r.addr < r.end);
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

    regionWith(addr: number): Region {
        const pos = this.indexOf(addr);
        return pos >= 0 ? this.regionAt(pos) : null;
    }

    regionAt(index: number): Region {
        return this.regions[index];
    }

    copyRegionAt(index: number): Region {
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
        const check = this.regionAt(pos);
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

        const first = this.copyRegionAt(pos);
        const next = this.copyRegionAt(pos);

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

        const first = this.copyRegionAt(pos);
        const next = this.regionAt(pos + 1);
        if (next.addr != first.end) throw new Error(`Cannot merge non-neighbor regions`);

        first.end = next.end;

        const layer = this.clone();
        layer.regions.splice(pos, 2, first);
        return layer;
    }

    mod(addr: number, type: string, line: string): Layer {
        const pos = this.indexOf(addr);
        if (pos < 0) throw new Error(`Cannot find region with layer = ${this.name} and addr = ${addr}(0x${addr.toString(16)})`);

        const range = this.copyRegionAt(pos);
        range.type = type;

        const layer = this.clone();
        layer.regions.splice(pos, 1, range);
        return layer;
    }

    free(addr: number, size: number): Layer {
        const pos = this.insertPosition(addr);
        if (size) {

        } else {
            if (pos < 0) throw new Error(`Cannot find region with layer = ${this.name} and addr = ${addr}(0x${addr.toString(16)})`);
        }

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
                layer = layer.free(log.addr, log.size);
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
