<script lang="ts">

import MemoryView from './MemoryView.svelte';
import Legend from './Legend.svelte';
import { load, Log, parse } from './memlog';
import Uploader from './Uploader.svelte';
import webkitConfig from './configs/webkit.config';
import { bytes, K } from './utils';

export let rowBytes = 256 * K; // bytes

const configs = {
    webkit: webkitConfig,
};

const test = `# simple case
alloc ts:0 layer:vm addr:1*M/2 size:1*M/4
alloc ts:0 layer:vm addr:2*M size:1*M/2
split ts:0 layer:vm addr:2*M size:1*M/4
free ts:0 layer:vm addr:2*M+1*M/4
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

<h1>Memory Viewer</h1>

Choose memlog file: <Uploader on:load={event => {
    loadSource(event.detail)
}} />

<div>
    <button on:click={ev => rowBytes *= 2}>-</button>
    {bytes(rowBytes)}
    <button on:click={ev => rowBytes /= 2}>+</button>
</div>

<MemoryView {regions} {start} {end} {config} {rowBytes} style="" />

<footer>
    <pre>{memlog.logs[index]?.line}</pre>
    <input type="range" min="0" max={memlog.length - 1} bind:value={index}>
    <table>
        {#each Object.keys(config.layers) as name}
            <tr><th>{name}</th><td><Legend types={config.layers[name].types}/></td></tr>
        {/each}
    </table>
</footer>

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

footer {
    position: fixed;
    bottom: 0;
    width: 100%;
    background-color: white;
    border-top: solid 1px gray;
}

footer th {
    text-align: right;
}

</style>