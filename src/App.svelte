<script lang="ts">

import MemoryView from './MemoryView.svelte';
import { load, Log, Memlog, parse } from './memlog';
import Uploader from './Uploader.svelte';
import webkitConfig from './configs/webkit.config';
import { K, M } from './utils';
import Footer from './Footer.svelte';

export let rowBytes = 256 * K; // bytes

const configs = {
    webkit: webkitConfig,
};

const test = `# simple case
alloc ts:0 layer:vm addr:${1*M/2} size:${1*M/4}
alloc ts:0 layer:vm addr:${2*M} size:${1*M/2}
split ts:0 layer:vm addr:${2*M} size:${1*M/4}
free ts:0 layer:vm addr:${2*M+1*M/4}
`;

let logs;
let memlog: Memlog;
let index;
let config = configs.webkit;

let regions;
let start;
let end;

function loadSource(source) {
    logs = parse(source);
    memlog = new Memlog();
    index = 0;
    start = 0;
    end = 0;
    iterate(); 
}

// loadSource(test);

function step() {
    if (!logs || !logs.length) return false;
    const [log, ...newLogs] = logs;
    logs = newLogs;
    memlog.add(log);

    index = memlog.length - 1;
    regions = memlog.getRegions(index);
    start = memlog.start;
    end = memlog.end;
    return true;
}

function iterate() {
    const more = Array.from(new Array(500)).every(step);
    setTimeout(iterate, more ? 17 : 1000);
}

</script>

<h1>MEMLOG Viewer</h1>

{#if !memlog}

Choose memlog file: <Uploader on:load={event => {
    loadSource(event.detail)
}} />

{:else}

<button on:click={step}>Process 1</button>

<MemoryView {regions} {start} {end} {config} {rowBytes} style="" />

<pre>
{#each logs.slice(0, 10) as log}
    {log.line}<br>
{/each}
</pre>

<div class="dummy-footer">
    <Footer {config} {memlog} {index} />
</div>

<footer>
    <Footer {config} {memlog} bind:index={index} bind:rowBytes={rowBytes} />
</footer>

{/if}

<style>

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