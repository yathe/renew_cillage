// src/types/next.d.ts
import 'next';

declare module 'next' {
  type PageParams<T = {}> = {
    params: T;
    searchParams?: Record<string, string | string[] | undefined>;
  };
}
