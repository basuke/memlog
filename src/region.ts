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
