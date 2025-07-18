import { unstable_cache as nextCache } from "next/cache";
import { cache as reactCache } from "react";

// 🎯 A generic type: Callback is any async function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = (...args: any[]) => Promise<any>


// 🚀 Our custom cache wrapper
// ✅ Wraps a given async function with both React's cache & Next.js cache
// ✅ keyParts and options control how caching behaves
export function cache<T extends Callback>(
  cb: T,                                   // 💡 The async function to cache
  keyParts: string[],                       // 🔑 Cache key parts (uniquely identifies result)
  options: { revalidate?: number | false; tags?: string[] } = {} // 🛠️ Extra cache settings
) {
  // 🧵 Logic layering:
  // reactCache(cb)  👉 Wraps cb to memoize results at runtime (avoids re‑calls in same render)
  // nextCache(...)  👉 Wraps that again with Next.js server cache (persists across requests)
  return nextCache(reactCache(cb), keyParts, options)
}
