<script lang="ts">

import MemoryView from './MemoryView.svelte';
import { Log } from './log';
import { Memlog } from './memlog';
import Uploader from './Uploader.svelte';
import webkitConfig from './configs/webkit.config';
import { K, M } from './utils';
import Footer from './Footer.svelte';
import { onDestroy } from 'svelte';

export let rowBytes = 1 * M; // bytes

const configs = {
    webkit: webkitConfig,
};

const test = `# simple case
alloc ts:0 layer:vm addr:${1*M/2} size:${1*M/4}
alloc ts:0 layer:vm addr:${2*M} size:${1*M/2}
split ts:0 layer:vm addr:${2*M} size:${1*M/4}
free ts:0 layer:vm addr:${2*M+1*M/4}
`;

let memlog: Memlog;
let index;
let config = configs.webkit;

let regions;
let worker: Worker;
let logCount = 0;
let logProcessed = 0;

function reset() {
    stop();
    memlog = null;
}

function stop() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
}

function loadSource(source) {
    stop();

    logCount = logProcessed = 0;
    worker = new Worker('build/worker.js');
    worker.onmessage = e => {
        if (!e.data) {
            stop();
            return;
        }

        if (typeof e.data === 'number') {
            logCount = e.data;
            logProcessed = 0;
            return;
        }

        const log = Log.deseriarize(e.data);
        // console.log(log.line);
        memlog.process(log);
        index = memlog.length - 1;
        regions = memlog.getRegions(index);
        logProcessed += 1;
    };

    memlog = new Memlog();
    index = 0;
    regions = memlog.getRegions(index);

    worker.postMessage(source);
}

loadSource(test);

onDestroy(() => stop());

window.onunload = () => stop();

</script>

<nav>
<h1>MEMLOG Viewer</h1>

{#if !memlog}

<div>
Choose memlog file: <Uploader on:load={event => {
    loadSource(event.detail)
}} />
</div>
<div></div>

{/if}

{#if memlog}

<div>
    {#if worker}
        {logProcessed} / {logCount}
        <button on:click={stop}>Stop</button>
    {/if}
    <button class=open on:click={reset}>Open...</button>
</div>

{/if}

</nav>

{#if memlog}

{#if !worker}
<MemoryView {regions} {config} {rowBytes} style="" />

<div class="dummy-footer">
    <Footer {config} {memlog} {index} />
</div>

<footer>
    <Footer {config} {memlog} bind:index={index} bind:rowBytes={rowBytes} />
</footer>

{/if}

{/if}

<style>

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

h1 {
    margin: 0 0.2rem;
    color: #ff3e00;
    font-size: 1.5rem;
    font-weight: lighter;
}

.open {
    margin-left: 0.5rem;
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