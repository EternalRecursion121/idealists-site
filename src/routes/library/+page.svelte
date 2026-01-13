<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
</script>

<svelte:head>
    <title>Library — The Idealists Collective</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16 min-h-screen flex flex-col">
    <header class="mb-8 sm:mb-12 text-center">
        <h1 class="text-2xl sm:text-3xl font-semibold mb-4">library</h1>
        <p class="opacity-70 max-w-xs mx-auto">readings, videos, and manifestos that have influenced us</p>
    </header>

    <section class="text-center">
        <ul class="space-y-8 inline-block">
            <li>
                <a href="https://monoskop.org/images/e/e3/Beer_Stafford_Designing_Freedom.pdf" target="_blank" rel="noopener" class="block group">
                    <h2 class="font-semibold mb-1 group-hover:opacity-70">Designing Freedom</h2>
                    <p class="text-sm opacity-60 mb-2">Stafford Beer, 1974</p>
                </a>
            </li>
            <li>
                <a href="https://resonantcomputing.org/" target="_blank" rel="noopener" class="block group">
                    <h2 class="font-semibold mb-1 group-hover:opacity-70">Resonant Computing Manifesto</h2>
                    <p class="text-sm opacity-60 mb-2">resonantcomputing.org</p>
                </a>
            </li>
            <li>
                <a href="https://youtu.be/1nyXb4wCg_Y" target="_blank" rel="noopener" class="block group">
                    <h2 class="font-semibold mb-1 group-hover:opacity-70">Dreams Beyond the Algorithm</h2>
                    <p class="text-sm opacity-60 mb-2">Then & Now, YouTube</p>
                </a>
            </li>
            <li>
                <a href="https://www.gnu.org/gnu/manifesto.en.html" target="_blank" rel="noopener" class="block group">
                    <h2 class="font-semibold mb-1 group-hover:opacity-70">The GNU Manifesto</h2>
                    <p class="text-sm opacity-60 mb-2">Richard Stallman, 1985</p>
                </a>
            </li>
            <li>
                <a href="https://henry.codes/writing/a-website-to-destroy-all-websites" target="_blank" rel="noopener" class="block group">
                    <h2 class="font-semibold mb-1 group-hover:opacity-70">a website to end all websites</h2>
                    <p class="text-sm opacity-60 mb-2">Henry Desroches</p>
                </a>
            </li>
            <li>
                <a href="https://www.inkandswitch.com/essay/malleable-software/" target="_blank" rel="noopener" class="block group">
                    <h2 class="font-semibold mb-1 group-hover:opacity-70">Malleable Software</h2>
                    <p class="text-sm opacity-60 mb-2">Ink & Switch</p>
                </a>
            </li>
        </ul>
    </section>

	<BottomNav current="library" />
</div>

