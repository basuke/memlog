<script lang="ts">

import MemoryView from './MemoryView.svelte';
import Uploader from './Uploader.svelte';
import webkitConfig from '../configs/webkit.config';
import Footer from './Footer.svelte';
import Zoomer from './Zoomer.svelte';
import { M, Memlog, Log, hex } from '../memlog';
import { onDestroy } from 'svelte';

export let rowBytes = 0.5* M; // bytes

const configs = {
    webkit: webkitConfig,
};

const test = `# memlog [compact]
a 0 vm ${1*M/2} ${1*M/4}
a 0 vm ${2*M} ${1*M/2}
s 0 vm ${2*M} ${1*M/4}
f 0 vm ${2*M+1*M/4} ${1*M/4}

a 1 page 0x120000 0xc0000 free
f 1 page 0x180000 0x40000 free

`;

let memlog: Memlog;
let index;
let config = configs.webkit;

let regions;
let worker: Worker;
let logCount = 0;
let logProcessed = 0;

$: showMemLog = memlog && !worker;

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
        logProcessed += 1;
    };

    memlog = new Memlog(config);
    index = 0;

    worker.postMessage(source);
}

loadSource(test);

onDestroy(() => stop());

window.onunload = () => stop();

</script>

<nav>
<h1>MEMLOG Viewer</h1>

{#if showMemLog}
    <Zoomer bind:rowBytes />
{/if}

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
        <button on:click={stop}>Stop</button>
    {/if}
    <button class=open on:click={reset}>Open...</button>
</div>

{/if}

</nav>

{#if memlog}

{#if showMemLog}
<MemoryView regions={memlog.getRegions(index)} {config} {rowBytes} style="" />

<div class="dummy-footer">
    <Footer {config} {memlog} {index} />
</div>

<footer>
    <Footer {config} {memlog} bind:index={index} />
</footer>

{:else}

<div class=loading>
    <p>Loading...</p>
    {#if logCount}
        <progress max={logCount} value={logProcessed}> {Math.floor(logProcessed / logCount) * 100}% </progress>
        <br>
        {logProcessed} / {logCount}
    {:else}
        <div><img src="/assets/loading.gif" alt=loading></div>
    {/if}
</div>


{/if}

{/if}

<style>

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

main {
    display: flex;
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

.loading {
    margin-top: 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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