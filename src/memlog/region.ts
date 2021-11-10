export type Region = {
    addr: number;
    end: number;
    type?: string;
    // logs?: string[];
};

export function overwrap(a: Region, b: Region): boolean {
    return !(a.end <= b.addr || b.end <= a.addr);
}

export function contains(r: Region, addr: number): boolean {
    return addr >= r.addr && addr < r.end;
}

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

export interface StartEnd {
    addr: number;
    end: number;
};

export function updateStartEnd(a: StartEnd, b: StartEnd) {
    if (a.addr === undefined) {
        a.addr = b.addr;
        a.end = b.end;
    } else {
        a.addr = Math.min(a.addr, b.addr);
        a.end = Math.max(a.end, b.end);
    }
}

export class SortedRegions {
    regions: Region[] = [];
    addr: number = undefined;
    end: number = undefined;

    get length(): number {
        return this.regions.length;
    }

    get empty(): boolean {
        return this.length === 0;
    }

    regionWith(addr: number): Region|null {
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

    find(addr: number): [number, Region?] {
        let pos = this.insertPosition(addr);
        let region = this.regionAt(pos);

        if (region) {
            if (region.end > addr) {
                return [pos, region];
            }
        } else if (pos > 0) {
            pos -= 1;
            region = this.regionAt(pos);
            if (region.end > addr) {
                return [pos, region];
            }
        }
        return [-1, null];
    }

    insert(pos: number, region: Region) {
        this.regions.splice(pos, 0, region);
        updateStartEnd(this, region);
    }

    remove(pos: number) {
        this.regions.splice(pos, 1);
    }

    removeAndInsert(start: number, stop: number, regions: Region[]) {
        this.regions.splice(start, stop - start, ...regions);
    }
}
