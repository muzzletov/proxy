<script lang="ts">
    let {value = $bindable() } = $props();
</script>

<textarea
        oninput={
            (event: InputEvent)=>
            value = `data:text/plain;base64,${btoa(encodeURIComponent(event.target.value))}`
        }
        placeholder="Script"
        rows="10"
></textarea>
