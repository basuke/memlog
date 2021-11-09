import type { LayerConfig } from './config';
import { contains, overwrap, Region, SortedRegions, subtract } from './region';
import { updateStartEnd } from './region';

export abstract class Layer extends SortedRegions {
    name: string;
    config: LayerConfig;
    addr: number = undefined;
    end: number = undefined;

    constructor(name: string, config: LayerConfig) {
        super();

        this.name = name;
        this.config = config;
    }

    abstract cls(): any;
    clone(): Layer {
        const cls = this.cls();
        const layer = new cls(this.name, this.config);
        layer.regions = [...this.regions];
        layer.addr = this.addr;
        layer.end = this.end;
        return layer;
    }

    abstract alloc(addr: number, size: number, type: string): Layer;
    abstract split(addr: number, size: number): Layer;
    abstract merge(addr: number, other: number): Layer;
    abstract mod(addr: number, type: string): Layer;
    abstract free(addr: number, size: number): Layer;
};

export class ManagedLayer extends Layer {
    cls(): any { return ManagedLayer; }

    alloc(addr: number, size: number, type: string): Layer {
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

    split(addr: number, size: number): Layer {
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

    merge(addr: number, other: number): Layer {
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

    mod(addr: number, type: string): Layer {
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

export class FlexibleLayer extends Layer {
    cls(): any { return FlexibleLayer; }

    alloc(addr: number, size: number, type: string): Layer {
        const layer = this.free(addr, size);

        let pos = this.insertPosition(addr);
        let start = pos;
        let end = pos;
        let region: Region = {
            addr,
            end: addr + size,
            type,
        };

        if (pos > 0) {
            const prev = layer.regionAt(pos - 1);
            if (prev.end === addr && prev.type === type) {
                region.addr = prev.addr;
                start -= 1;
            }
        }

        if (pos < layer.length) {
            const next = layer.regionAt(pos);
            if (next.addr === region.end && next.type === type) {
                region.end = next.end;
                end += 1;
            }
        }

        updateStartEnd(layer, region);
        layer.regions.splice(start, end - start, region);
        return layer;
    }

    split(addr: number, size: number): Layer {
        throw new Error("split is not supported in FlexibleLayer");
    }

    merge(addr: number, other: number): Layer {
        throw new Error("merge is not supported in FlexibleLayer");
    }

    mod(addr: number, type: string): Layer {
        const [pos, region] = this.find(addr);

        if (pos < 0) {
            throw new Error('cannot find region with addr');
        }

        const layer = this.clone();
        layer.regions.splice(pos, 1, { ...region, type });
        return layer;
    }

    free(addr: number, size: number): Layer {
        if (size === 0) {
            throw new Error('size must be valid');
        }

        const layer = this.clone();
        const removing = { addr, end: addr + size };

        layer.regions = layer.regions.reduce((regions, region) => {
            return [...regions, ...subtract(region, removing)];
        }, []);

        return layer;
    }
};

export class LayerFactory {
    configs: Record<string, LayerConfig>;

    constructor(configs: Record<string, LayerConfig>) {
        this.configs = configs;
    }

    create(name: string): Layer|null {
        const config = this.configs[name];
        if (!config || config.disabled) {
            console.warn(!config ? `cannot find layer config for ${name}` : `layer ${name} is disabled`);
            return null;
        }

        if (config.management && config.management === 'flexible') {
            console.log(`${name} is flexible layer`)
            return new FlexibleLayer(name, config);
        }
        return new ManagedLayer(name, config);
    }
}
