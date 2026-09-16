// Old browsers may have cached the former permanent /services → /approach
// redirect. Render the same content here, with /services canonical metadata,
// instead of reversing that redirect and creating a cached redirect loop.
export { default, generateMetadata } from "../services/page";
