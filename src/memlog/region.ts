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
