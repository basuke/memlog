import { Actions, Log } from "./log";
import { Layer, LayerFactory } from './layer';
import { updateStartEnd } from "./region";
import type { Config } from "./config";

export class Regions {
    layers: Record<string, Layer> = {};
    addr: number = undefined;
    end: number = undefined;
    factory: LayerFactory;

    constructor(factory: LayerFactory) {
        this.factory = factory;
    }

    clone(): Regions {
        const regions = new Regions(this.factory);
        regions.layers = {...this.layers};
        regions.addr = this.addr;
        regions.end = this.end;
        return regions;
    }

    process(log: Log): Regions {
        const layerName = log.layer;
        let layer = (layerName in this.layers) ? this.layers[layerName] : this.factory.create(layerName);
        if (!layer) return this;

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

        const regions = this.clone();
        regions.layers[layerName] = layer;
        updateStartEnd(regions, layer);
        return regions;
    }
}

export class Memlog {
    history: Regions[] = [];
    addr: number;
    end: number;
    config: Config;
    factory: LayerFactory;

    constructor(config: Config) {
        this.config = config;
        this.factory = new LayerFactory(config.layers);
    }

    get length() {
        return this.history.length;
    }

    get latest(): Regions {
        return this.getRegions(this.length - 1);
    }

    getRegions(index): Regions {
        if (index < 0 || index >= this.length) return new Regions(this.factory);
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
