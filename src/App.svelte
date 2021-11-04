<script lang="ts">

import MemoryView from './MemoryView.svelte';
import { Log, Memlog, parse } from './memlog';
import Uploader from './Uploader.svelte';
import webkitConfig from './configs/webkit.config';
import { K, M } from './utils';
import Footer from './Footer.svelte';

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

let logs: Log[]|undefined;
let totalLogs: number = 0;
let memlog: Memlog;
let index;
let config = configs.webkit;

let regions;
let worker: Worker;

function loadSource(source) {
    if (worker) {
        worker.terminate();
        worker = null;
    }

    worker = new Worker('build/worker.js');
    worker.onmessage = e => {
        const log = Log.deseriarize(e.data);
        console.log('received: ', log);
        logs = [...logs, log];
        totalLogs += 1;
    };

    memlog = new Memlog();
    index = 0;
    regions = memlog.getRegions(index);
    logs = [];
    totalLogs = 0;

    worker.postMessage(source);
}

let loading = false;

function run() {
    loading = true;
    iterate();
}

function stop() {
    loading = false;
}

function step() {
    while (logs && logs.length) {
        const [log, ...newLogs] = logs;
        logs = newLogs;

        const layerConfig = config.layers[log.layer];
        if (!layerConfig || layerConfig.disabled) continue;

        console.log(log.line);
        memlog.process(log);

        index = memlog.length - 1;
        regions = memlog.getRegions(index);
        return true;
    }
    stop();
    return false;
}

function iterate() {
    const more = Array.from(new Array(1)).every(step);
    if (loading) setTimeout(iterate, more ? 17 : 1000);
}

loadSource(test);

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
    {#if logs && logs.length}
        {#if loading}
        <button on:click={stop}>Stop</button>
        {:else}
        <button on:click={step}>Process 1</button>
        <button on:click={run}>Run</button>
        {/if}
    {/if}
    <button class=open on:click={() => memlog = null }>Open...</button>
</div>

{/if}

</nav>

{#if memlog}

<MemoryView {regions} {config} {rowBytes} style="" />

{#if logs && logs.length}
<div>log {totalLogs - logs.length + 1} of {totalLogs}</div>
<pre>
{#each logs.slice(0, 10) as log}
    {log.line}<br>
{/each}
</pre>
{/if}

<div class="dummy-footer">
    <Footer {config} {memlog} {index} />
</div>

<footer>
    <Footer {config} {memlog} bind:index={index} bind:rowBytes={rowBytes} />
</footer>

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