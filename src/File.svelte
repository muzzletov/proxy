<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
  
    let file = null;
  
    function handleChange(event) {
      file = event.target.files[0];
      dispatch('change', file);
    }
  </script>
  
  <input type="file" on:change={handleChange} />