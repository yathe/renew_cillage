import 'next';

declare module 'next' {
  type PageParams<T = object> = {  // Changed from {} to object
    params: T;
    searchParams?: Record<string, string | string[] | undefined>;
  };
}
