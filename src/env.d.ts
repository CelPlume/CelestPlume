/// <reference types="astro/client" />
/// <reference types="@astrojs/starlight/virtual" />

// Starlight generates this virtual module at build time; declare it for
// `astro check` (same shape as Starlight's own virtual-internal.d.ts).
declare module 'virtual:starlight/components/Search' {
	const Search: typeof import('@astrojs/starlight/components/Search.astro').default;
	export default Search;
}
declare module 'virtual:starlight/components/EditLink' {
	const EditLink: typeof import('@astrojs/starlight/components/EditLink.astro').default;
	export default EditLink;
}
declare module 'virtual:starlight/components/Pagination' {
	const Pagination: typeof import('@astrojs/starlight/components/Pagination.astro').default;
	export default Pagination;
}
