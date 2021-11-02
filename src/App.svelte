<script lang="ts">

import MemoryView from './MemoryView.svelte';
import Legend from './Legend.svelte';
import { load, Log, parse } from './memlog';
import Uploader from './Uploader.svelte';
import webkitConfig from './configs/webkit.config';
import { bytes, K } from './utils';
import Footer from './Footer.svelte';

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

<h1>MEMLOG Viewer</h1>

{#if !memlog}

Choose memlog file: <Uploader on:load={event => {
    loadSource(event.detail)
}} />

{:else}

<MemoryView {regions} {start} {end} {config} {rowBytes} style="" />

<div class="dummy-footer">
    <Footer {config} {memlog} {index} />
</div>

<footer>
    <Footer {config} {memlog} bind:index={index} bind:rowBytes={rowBytes} />
</footer>

{/if}

<style>

main {
    text-align: center;
    padding: 0;
}

h1 {
    color: #ff3e00;
    font-size: 1.5rem;
    font-weight: lighter;
}

footer {
    position: fixed;
    bottom: 0;
    background-color: white;
    border-top: solid 1px gray;
}

.dummy-footer {
    visibility: hidden;
}

footer, .dummy-footer {
    width: 100%;
}

</style>