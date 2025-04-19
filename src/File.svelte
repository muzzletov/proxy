<script lang="ts">
    let {value} = $props();
</script>
  
<input
        onchange={
            (event: InputEvent)=>
            value = `data:text/plain;base64,${btoa(encodeURIComponent(event.target.value))}`
        }
        type="file"
/>