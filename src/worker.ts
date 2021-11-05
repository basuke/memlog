import { Log, parse } from './log';
import config from './configs/webkit.config';

console.log('Worker started.');

onmessage = function(e) {
    console.log('Worker received message');
    const source = e.data;
    const logs = parse(source).filter(log => {
        const layerConfig = config.layers[log.layer];
        return (layerConfig && !layerConfig.disabled);
    });

    postMessage(logs.length);
    for (const log of logs) {
        postMessage(log.serialize());
    }
    postMessage(null);
};
