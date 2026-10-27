const OPENL_API_URL = process.env.NEXT_PUBLIC_OPENL_API_URL;
const GOOGLE_BOOKS_URL = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_URL;
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

export const apiConfig = {
  openLibrary: {
    baseURL: OPENL_API_URL,
    endpoints: {
      search: '/search.json',
      works: '/works',
      subjects: '/subjects',
      authors: '/authors'
    }
  },
  googleBooks: {
    baseURL: GOOGLE_BOOKS_URL,
    apiKey: GOOGLE_BOOKS_API_KEY,
    endpoints: {
      volumes: '/volumes',
    }
  },
  timeout: 10000,
};
