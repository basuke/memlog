import { Log, parse } from './memlog';
import config from './configs/webkit.config';

onmessage = function(e) {
    console.log('Worker received message');
    const source = e.data;

    for (const log of parse(source)) {
        const layerConfig = config.layers[log.layer];
        if (layerConfig && !layerConfig.disabled) {
            this.postMessage(log.serialize());
        }
    }
    this.postMessage(null);
};
