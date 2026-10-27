import { apiConfig } from "./config";
import { BookSearchResponse, Book } from "../types/book";
import { supabase } from "../supabase/client";
import { getRandomInt } from "../utils/random";

const API_BASE_URL = apiConfig.openLibrary.baseURL;

/**
 * Searches for books using the Open Library API and syncs new books to the database.
 * @param query The search term.
 * @param limit The number of results to return per page.
 * @param offset The starting point for the results.
 * @returns A promise that resolves with a paginated book search response.
 */
export const searchBooks = async (
  query: string,
  limit: number = 12,
  offset: number = 0,
  sortBy: string = "popularity", 
  subject?: string 
): Promise<BookSearchResponse> => {
  if (!API_BASE_URL) {
    throw new Error("Open Library API URL is not configured.");
  }

  let url = `${API_BASE_URL}/search.json?q=${encodeURIComponent(query)}`;

  url += `&limit=${limit}&offset=${offset}`;

  const olSortMap: Record<string, string> = {
    popularity: "rating",
    publishedDate: "old", // Oldest first
    newest: "new",
    author: "author",
    title: "title",
  };

  const sortParam = olSortMap[sortBy] || "rating";
  url += `&sort=${sortParam}`;

  if (subject && subject !== 'All' && !query.includes(subject)) {
        url += `&subject=${encodeURIComponent(subject)}`;
    }
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(apiConfig.timeout),
    });
    if (!response.ok) {
      throw new Error(`Failed to search for books: ${response.statusText}`);
    }

    const data: BookSearchResponse = await response.json();

    // Sync books to the database in the background
    data.docs.forEach((book) => syncBookWithDatabase(book.key));

    return data;
  } catch (error) {
    console.error("Open Library API request failed:", error);
    throw error;
  }
};

/**
 * Syncs a book from Open Library to the Supabase database if it doesn't already exist.
 * @param bookKey The unique key of the book from Open Library.
 */
export const syncBookWithDatabase = async (bookKey: string) => {
  try {
    // Check if the book already exists in our database
    const { data: existingBook, error: selectError } = await supabase
      .from("books")
      .select("key")
      .eq("key", bookKey)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error("Error checking for existing book:", selectError);
      return;
    }

    if (!existingBook) {
      const { error: insertError } = await supabase.from("books").insert({
        key: bookKey,
        available_copies: getRandomInt(1, 5),
        popularity: getRandomInt(10, 100),
      });

      if (insertError) {
        console.error("Error adding new book to database:", insertError);
      }
    }
  } catch (error) {
    console.error("An unexpected error occurred during book sync:", error);
  }
};

/**
 * Retrieves full details for a book using its work key.
 * @param workKey The book's work key.
 * @returns A promise that resolves with the book's detailed information.
 */
export const getBookDetails = async (workKey: string): Promise<Book> => {
  if (!API_BASE_URL) {
    throw new Error("Open Library API URL is not configured.");
  }

  const url = `${API_BASE_URL}${workKey}.json`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(apiConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to get book details: ${response.statusText}`);
    }

    const data: Book = await response.json();
    return data;
  } catch (error) {
    console.error("Book details request failed:", error);
    throw error;
  }
};

/**
 * Generates the URL for a book's cover image.
 * @param coverId The ID of the cover.
 * @param size The size of the image ('S' for small, 'M' for medium, 'L' for large).
 * @returns The URL of the cover image.
 */
export const getBookCoverUrl = (
  coverId: number,
  size: "S" | "M" | "L" = "M"
): string => {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
};

const fetchAuthorName = async (authorKey: string): Promise<string> => {
  try {
    const url = `${API_BASE_URL}${authorKey}.json`;
    const response = await fetch(url);
    if (!response.ok) return "Unknown Author";
    const data = await response.json();
    return data.name || "Unknown Author";
  } catch (e) {
    return "Unknown Author";
  }
};

/**
 * Retrieves full details for a book using its work key from Open Library.
 * It fetches the OL Work record and then performs nested fetches for all Author names.
 * It also fetches custom data (availability, popularity) from Supabase.
 * * @param workKey The book's work key (e.g., "OL45804W").
 * @returns A promise that resolves with the combined book details.
 */
export const getDetailedBookData = async (workKey: string): Promise<Book> => {
  if (!API_BASE_URL || !workKey) {
    throw new Error("API URL or work key is missing.");
  }

  const keyId = workKey.includes("/") ? workKey.split("/").pop()! : workKey;
  const olUrl = `${API_BASE_URL}/works/${keyId}.json`;

  try {
    const olResponse = await fetch(olUrl, {
      signal: AbortSignal.timeout(apiConfig.timeout),
    });

    if (!olResponse.ok) {
      throw new Error(
        `Error fetching Open Library details. Status: ${olResponse.status} - ${
          olResponse.statusText || "No Status Text"
        }.`
      );
    }

    const olData: any = await olResponse.json();
    const authorKeys = olData.authors?.map((a: any) => a.author.key) || [];

    const authorNames = await Promise.all(
      authorKeys.map((key: string) => fetchAuthorName(key))
    );

    const fullKey = `/works/${keyId}`;
    const { data: supabaseData, error: dbError } = await supabase
      .from("books")
      .select("available_copies, popularity, key, id")
      .eq("key", fullKey)
      .single();

    if (dbError && dbError.code !== "PGRST116") {
      // PGRST116 = No rows found
      console.error("Supabase fetch error:", dbError);
    }

    // Combine and Transform
    const description = olData.description
      ? typeof olData.description === "string"
        ? olData.description
        : olData.description.value
      : "No description available.";

    const combinedBook: Book = {
      key: fullKey,
      title: olData.title || "Untitled",
      author_name: authorNames,

      cover_i: olData.covers?.[0],
      subject: olData.subjects || [],
      description: description,
      first_publish_year: olData.first_publish_year, // Include more data

      // Supabase/Custom fields
      availability: {
        is_available: (supabaseData?.available_copies || 0) > 0,
        due_date: undefined,
      },
      available_copies: supabaseData?.available_copies || 0,
      popularity: supabaseData?.popularity || 0,
      db_id: supabaseData?.id,
    };

    return combinedBook;
  } catch (error) {
    console.error("Error in getDetailedBookData:", error);
    throw error;
  }
};

/**
 * Fetches the most popular books from the DB, then fetches details from OL for display.
 * @param limit The number of books to retrieve.
 * @returns An array of popular book data ready for display.
 */
export const fetchPopularBooks = async (limit: number): Promise<Book[]> => {
  const { data: dbBooks, error } = await supabase
    .from("books")
    .select(
      `
            id:id,
            key,
            available_copies,
            popularity
        `
    )
    .order("popularity", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching popular books from DB:", error);
    return [];
  }

  const detailedBooks = await Promise.all(
    (dbBooks || []).map(async (book) => {
      const workKey = book.key.split("/").pop()!;
      try {
        const olData = await getDetailedBookData(workKey);
        return {
          db_id: book.id,
          key: book.key,
          available_copies: book.available_copies,
          popularity: book.popularity,
          title: olData.title,
          author_name: olData.author_name,
          cover_i: olData.cover_i || 0,
          availability_status:
            (book.available_copies || 0) > 0 ? "available" : "borrowed",
          borrowCount: book.popularity,
        };
      } catch (e) {
        return null;
      }
    })
  );

  return detailedBooks.filter((b) => b !== null) as Book[];
};
