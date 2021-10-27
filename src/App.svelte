<script lang="ts">

import MemoryView from './MemoryView.svelte';
import { parse } from './memlog';
import { processLog } from './region';
import Uploader from './Uploader.svelte';
import type { Config } from './config';

const config: Config = {
    layers: {
        vm: {
            types: {
                rw: { color: 'lightblue' },
                _: { color: 'DeepPink' },
            },
        },
        bmalloc: {
            types: {
                free: { color: 'lightgray' },
                large: { color: 'SlateBlue' },
                chunk: { color: 'SandyBrown' },
                perProcess: { color: 'lime' },
                perThread: { color: 'OrangeRed' },
                vector: { color: 'DeepPink' },
                objectTypeTable: { color: 'DarkOliveGreen' },
                external: { color: 'PaleGreen' },
                _: { color: 'Fuchsia' },
            },
        },
    },
};

const test = `# simple case
alloc ts:0 addr:1*M/2 size:1*M/4
alloc ts:0 addr:2*M size:1*M/2
`;

let regions = {};
load(test);
let history = [];

function load(source) {
    regions = parse(source).reduce(processLog, {});
}

</script>

<main>
    <h1>Memory Viewer</h1>
    Choose memlog file: <Uploader on:load={event => load(event.detail)} />
    <MemoryView {regions} {config} rowBytes={64 * 1024 * 4} style="border: solid 1px gray" />
</main>
<button on:click={() => {
    const source = "alloc ts:1 addr:0 size:0.125*M\n";
    const logs = parse(source);
    console.log('logs', logs);
    regions = processLog(regions, logs[0]);
}}>Test</button>
<pre>{JSON.stringify(regions, null, 2)}</pre>

<style>

main {
    text-align: center;
}

h1 {
    color: #ff3e00;
    font-size: 1.5rem;
    font-weight: lighter;
}
</style>