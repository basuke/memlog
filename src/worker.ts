import { Log, parse } from './memlog';

onmessage = function(e) {
    console.log('Worker received message');
    const source = e.data;

    for (const log of parse(source)) {
        this.postMessage(log.serialize());
    }
};
