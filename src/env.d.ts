/// <reference types="astro/client" />
/// <reference types="@astrojs/starlight/virtual" />

// Starlight generates this virtual module at build time; declare it for
// `astro check` (same shape as Starlight's own virtual-internal.d.ts).
declare module 'virtual:starlight/components/Search' {
	const Search: typeof import('@astrojs/starlight/components/Search.astro').default;
	export default Search;
}
