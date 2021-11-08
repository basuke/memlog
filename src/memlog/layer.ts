import type { Region } from './region';
import { updateStartEnd } from './region';

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
