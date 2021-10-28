<script lang="ts">

import MemoryView from './MemoryView.svelte';
import { load, Log, parse } from './memlog';
import Uploader from './Uploader.svelte';
import webkitConfig from './configs/webkit.config';

const configs = {
    webkit: webkitConfig,
};

const test = `# simple case
alloc ts:0 addr:1*M/2 size:1*M/4
alloc ts:0 addr:2*M size:1*M/2
split ts:0 addr:2*M size:1*M/4
free ts:0 addr:2*M+1*M/4
`;

let memlog;
let index;
let config = configs.webkit;

$: regions = memlog.history[index];
$: start = memlog.address.start;
$: end = memlog.address.end;

function loadSource(source) {
    memlog = load(source);
    index = 0;
}

loadSource(test);

</script>

<main>
    <h1>Memory Viewer</h1>
    Choose memlog file: <Uploader on:load={event => { memlog = load(event.detail); } } />

        <input type="range" min="0" max={memlog.length - 1} bind:value={index}>

        <pre>{memlog.logs[index]?.line}</pre>
    <MemoryView {regions} {start} {end} {config} rowBytes={64 * 1024 * 4} style="border: solid 1px gray" />
</main>

<style>

main {
    text-align: center;
}

h1 {
    color: #ff3e00;
    font-size: 1.5rem;
    font-weight: lighter;
}

input[type=range] {
    display: block;
    width: 100%;
}
</style>