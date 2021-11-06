<script lang="ts">

export let translate: string | [number, number] | undefined = undefined;
export let translateX: number | undefined = undefined;
export let translateY: number | undefined = undefined;
export let rotate: number | undefined = undefined;
export let comment = '';

$: transform = ((): string => {
    const ops = [];

    if (translate) {
        if (Array.isArray(translate)) {
            translate = translate.join(' ');
        }
        ops.push(`translate(${translate})`);
    }

    if (translateX) {
        ops.push(`translate(${translateX} 0)`);
    }

    if (translateY) {
        ops.push(`translate(0 ${translateY})`);
    }

    if (rotate) {
        ops.push(`rotate(${rotate})`);
    }

    return ops.join(' ');
})();

</script>

<g {transform} data-comment={comment}><slot/></g>
