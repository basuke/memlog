<script lang="ts">

import MemoryView from './MemoryView.svelte';
import { parse } from './memlog';
import { calcRange, processLog } from './region';
import Uploader from './Uploader.svelte';
import config from './configs/webkit.config';

const test = `# simple case
alloc ts:0 addr:1*M/2 size:1*M/4
alloc ts:0 addr:2*M size:1*M/2
`;

let regions = {};
let start = 0;
let end = 0;

load(test);
let history = [];

function load(source) {
    regions = parse(source).reduce(processLog, {});
    const range = calcRange(regions);
    start = range[0];
    end = range[1];
}

</script>

<main>
    <h1>Memory Viewer</h1>
    Choose memlog file: <Uploader on:load={event => load(event.detail)} />
    <MemoryView {regions} {start} {end} {config} rowBytes={64 * 1024 * 4} style="border: solid 1px gray" />
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