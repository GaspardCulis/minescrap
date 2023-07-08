import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";

export default defineConfig({
  site: 'https://gaspardculis.github.io',
  base: '/minescrap',
  integrations: [tailwind(), svelte()]
});