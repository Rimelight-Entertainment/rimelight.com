import type { EntryType, EntryData, SearchResults, EntryNode } from "~/types/Entry";
import { useRouter } from "#app";
import type { ApiErrorResponse } from "~/types/api";

/**
 * Custom Error type for HTTP-related errors, including the HTTP status code.
 */
export class HttpError extends Error {
    public status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

/**
 * A client-side cache for entry names, mapping entry slugs to their corresponding names.
 * This helps reduce redundant API calls for frequently accessed name lookups.
 */
const entryNameCache = new Map<string, string>();

/**
 * A client-side cache for entry slugs, mapping entry IDs to their corresponding slugs.
 * This helps reduce redundant API calls for frequently accessed slug lookups.
 */
const slugCache = new Map<string, string>();

/**
 * A composable containing client-side utility functions for interacting with the entry API.
 * This bundles various entry-related operations for easy access.
 */
export function useEntryUtils() {
    const router = useRouter(); // Access Nuxt's router

    return {
        /**
         * Initiates a entry move operation on the server.
         * Sends the entry ID, its original filename, and the new parent slug path to the server.
         * @param {string} entryId The ID of the entry to move.
         * @param {string} originalFilename The original filename of the entry (e.g., 'about.json' -> 'about').
         * @param {string} newParentSlugPath The new directory path for the entry (e.g., 'games/adventure'). Empty string for root.
         * @returns {Promise<void>} A promise that resolves if the move is successful.
         * @throws {HttpError} Throws an HttpError if the move operation fails.
         */
        moveEntry: async (
            entryId: string,
            originalFilename: string,
            newParentSlugPath: string,
        ): Promise<void> => {
            try {
                console.log(
                    `Client: Requesting to move entry ID "${entryId}" (filename: ${originalFilename}) to new path: "${newParentSlugPath}"`,
                );
                const response = await fetch("/api/entries/move", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ entryId, originalFilename, newParentSlugPath }),
                });

                if (!response.ok) {
                    let errorData: ApiErrorResponse = {};
                    try {
                        errorData = await response.json();
                    } catch (jsonError) {
                        console.error(
                            "Client: Failed to parse error response JSON during moveEntry:",
                            jsonError,
                        );
                    }
                    const errorMessage =
                        errorData.message || errorData.error || "Unknown error moving entry.";
                    throw new HttpError(
                        `Failed to move entry. Status: ${response.status}. ${errorMessage}`,
                        response.status,
                    );
                }
                slugCache.clear();
                console.log(
                    `Client: Entry ID '${entryId}' successfully requested to be moved. Cache cleared.`,
                );
            } catch (error) {
                console.error(
                    `Client: Error moving entry ID "${entryId}" to "${newParentSlugPath}/${originalFilename}":`,
                    error,
                );
                throw error;
            }
        },

        /**
         * Asynchronously fetches entry data from the API based on its slug.
         * Handles network errors, server errors, and specifically returns `null` for 404 Not Found responses.
         *
         * @param slug The slug of the entry to fetch.
         * @returns A promise that resolves to the EntryData object if found,
         * or `null` if the entry does not exist (404 status).
         * @throws {Error} Throws an error for network issues or non-404 server errors.
         */
        getEntry: async (slug: string): Promise<EntryData | null> => {
            // Sanitize the slug: remove leading/trailing slashes and default to 'index' for an empty slug.
            const cleanSlug = slug.replace(/^\/+|\/+$/g, "") || "index";
            // Construct the API endpoint URL for fetching the entry.
            const url = `/api/entries/${cleanSlug}`;

            let response: Response;
            try {
                // Attempt to fetch the entry data from the API.
                response = await fetch(url);
            } catch (networkError) {
                // Catch and log network-specific errors (e.g., no internet connection).
                if (networkError instanceof Error) {
                    console.error(
                        `Client: Network error fetching entry "${slug}" (URL: ${url}): ${networkError.message}`,
                    );
                } else {
                    console.error(
                        `Client: Unknown network error fetching entry "${slug}" (URL: ${url}):`,
                        networkError,
                    );
                }
                throw networkError; // Throw to propagate network errors.
            }

            // Check if the HTTP response was successful (status code 2xx).
            if (!response.ok) {
                // If the status is 404 (Not Found), it means the entry simply doesn't exist.
                // This is a common and expected scenario, so we return `null` rather than throwing an error.
                if (response.status === 404) {
                    console.log(
                        `Client: Entry not found (404) for slug "${slug}" (URL: ${url}).`,
                    );
                    return null;
                }

                // For any other non-OK status (e.g., 500, 400), attempt to parse the error details.
                let errorData: ApiErrorResponse = {};
                try {
                    errorData = (await response.json()) as ApiErrorResponse;
                } catch (jsonError) {
                    // If parsing the error response, JSON fails, log a warning but proceed with a generic message.
                    if (jsonError instanceof Error) {
                        console.warn(
                            `Client: Failed to parse error response JSON for slug "${slug}": ${jsonError.message}`,
                        );
                    }
                }

                // Construct a meaningful error message from the API response or a generic fallback.
                const errorMessage =
                    errorData.message ||
                    errorData.error ||
                    `Failed to fetch entry. Status: ${response.status} ${response.statusText}`;
                console.error(
                    `Client: Server error fetching entry "${slug}" (URL: ${url}):`,
                    errorMessage,
                );
                throw new HttpError(errorMessage, response.status); // Throw HttpError for server errors
            }
            // If the response is OK, parse the JSON and cast it to EntryData.
            return (await response.json()) as EntryData;
        },

        /**
         * Asynchronously saves (updates) entry data to the API.
         * It sends a PUT request with the full entry data and handles API response errors.
         *
         * @param entryData The EntryData object to be saved/updated.
         * @returns A promise that resolves when the entry is successfully saved.
         * @throws {HttpError} Throws an HttpError for network issues or non-OK API responses.
         */
        saveEntry: async (entryData: EntryData): Promise<void> => {
            // Sanitize the slug for the URL.
            const cleanSlug = entryData.slug.replace(/^\/+|\/+$/g, "");
            // Construct the API endpoint URL for saving the entry.
            const url = `/api/entries/${cleanSlug}`;

            try {
                // Send a PUT request to update the entry.
                const response = await fetch(url, {
                    method: "PUT", // Using PUT for updating an existing resource.
                    headers: {
                        "Content-Type": "application/json",
                    },
                    // Send the complete EntryData object as a JSON string in the request body.
                    body: JSON.stringify(entryData),
                });

                if (!response.ok) {
                    let errorData: ApiErrorResponse = {};
                    try {
                        // Attempt to parse the error response JSON for more details.
                        errorData = (await response.json()) as ApiErrorResponse;
                    } catch (jsonError) {
                        // If parsing fails, log a warning.
                        if (jsonError instanceof Error) {
                            console.warn(
                                `Client: Failed to parse error response JSON for entry "${entryData.slug}": ${jsonError.message}`,
                            );
                        }
                    }
                    // Construct a meaningful error message from the API response or a generic fallback.
                    const errorMessage =
                        errorData.message ||
                        errorData.error ||
                        `Failed to save entry. Status: ${response.status} ${response.statusText}`;

                    throw new HttpError(errorMessage, response.status);
                }
                console.log(`Client: Entry "${entryData.slug}" saved successfully.`);
            } catch (networkError) {
                console.error(
                    `Client: Error saving entry "${entryData.slug}":`,
                    networkError,
                );

                if (networkError instanceof HttpError) {
                    console.error(
                        `Client: HTTP Error saving entry: Status ${networkError.status}, Message: ${networkError.message}`,
                    );
                } else if (networkError instanceof Error) {
                    console.error(
                        `Client: General Network Error saving entry: ${networkError.message}`,
                    );
                } else {
                    console.error("Client: Unknown error saving entry:", networkError);
                }

                throw networkError;
            }
        },

        /**
         * Creates a new entry on the backend and then programmatically navigates
         * the user to the newly created entry's URL.
         *
         * @param slug The intended URL-friendly identifier for the new entry.
         * @param title The entry's title.
         * @param type The EntryType enum value that specifies which template to use.
         * @returns A promise that resolves when the entry is created and navigation is initiated.
         * @throws {Error} Throws an error if creating the entry fails or if navigation encounters an issue.
         */
        saveNewEntry: async (
            slug: string,
            title: string | undefined,
            type: EntryType,
        ): Promise<void> => {
            try {
                console.log(
                    `Client: Requesting to create new entry with slug "${slug}", title "${title}", and type "${type}".`,
                );
                const response = await fetch("/api/entries/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ slug, title: title || null, type }),
                });

                if (!response.ok) {
                    let errorData: ApiErrorResponse = {};
                    try {
                        errorData = await response.json();
                    } catch (jsonError) {
                        console.error(
                            "Client: Failed to parse error response JSON during saveNewEntry:",
                            jsonError,
                        );
                    }
                    const errorMessage =
                        errorData.message ||
                        errorData.error ||
                        "Unknown error creating new entry.";
                    throw new HttpError(
                        `Failed to create new entry. Status: ${response.status}. ${errorMessage}`,
                        response.status,
                    );
                }

                const newEntryData: EntryData = await response.json();
                await router.push(`/${newEntryData.slug}?mode=editor`); // Use the router instance
                console.log(`Client: Navigated to new entry: /${newEntryData.slug}`);
            } catch (error) {
                console.error("Client: Failed to create and save new entry:", error);
                throw error;
            }
        },

        /**
         * Asynchronously checks if a entry with the given slug already exists on the server.
         * It uses the `getEntry` utility, interpreting a `null` return as a non-existent entry.
         *
         * @param slug The slug of the entry to check for existence.
         * @returns A promise that resolves to `true` if the entry exists, `false` otherwise.
         * Returns `false` if `getEntry` throws an error for reasons other than 404
         * (e.g., network issues), as existence cannot be confirmed.
         */
        doesEntryExist: async (slug: string): Promise<boolean> => {
            try {
                const entry = await useEntryUtils().getEntry(slug); // Call getEntry from the same composable
                return entry !== null;
            } catch (error) {
                console.error(
                    `Client: Error checking entry existence for slug "${slug}":`,
                    error,
                );
                return false;
            }
        },

        /**
         * Retrieves the entry name for a given slug, utilizing a cache to avoid redundant API calls.
         * @param slug The slug of the entry.
         * @returns A promise that resolves to the entry's name, or null if not found.
         */
        getEntryNameBySlug: async (slug: string): Promise<string | null> => {
            if (entryNameCache.has(slug)) {
                return entryNameCache.get(slug)!;
            }

            try {
                const entryData = await useEntryUtils().getEntry(slug); // Call getEntry from the same composable
                if (entryData) {
                    entryNameCache.set(slug, entryData.title);
                    return entryData.title;
                }
                return null;
            } catch (error) {
                console.error(
                    `Client: Error fetching entry title for slug "${slug}":`,
                    error,
                );
                return null;
            }
        },

        /**
         * Fetches the hierarchical structure of all entries and folders.
         * @returns A promise that resolves to an array of FolderNode or EntryNode.
         */
        fetchEntryStructure: async (): Promise<(EntryNode | FolderNode)[]> => {
            try {
                const response = await fetch("/api/entries/structure", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    const errorData: ApiErrorResponse = await response.json();
                    throw new HttpError(
                        errorData.message || "Failed to fetch entry structure",
                        response.status,
                    );
                }

                return await response.json();
            } catch (error) {
                console.error("Client: Error fetching entry structure:", error);
                throw error;
            }
        },

        /**
         * Initiates a entry template conversion on the server.
         * The server will handle updating the entry's properties and blocks based on the target template.
         *
         * @param entryId The ID of the entry to convert.
         * @param targetEntryType The EntryType enum value to convert the entry to.
         * @returns A promise that resolves when the entry conversion is successful.
         * @throws {HttpError} Throws an HttpError if the conversion fails.
         */
        convertEntryTemplate: async (
            entryId: string,
            targetEntryType: EntryType,
        ): Promise<void> => {
            try {
                console.log(
                    `Client: Requesting to convert entry ID "${entryId}" to type "${targetEntryType}".`,
                );
                const response = await fetch("/api/entries/convert", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ entryId, targetEntryType }),
                });

                if (!response.ok) {
                    let errorData: ApiErrorResponse = {};
                    try {
                        errorData = await response.json();
                    } catch (jsonError) {
                        console.error(
                            "Client: Failed to parse error response JSON during convertEntryTemplate:",
                            jsonError,
                        );
                    }
                    const errorMessage =
                        errorData.message ||
                        errorData.error ||
                        "Unknown error converting entry template.";
                    throw new HttpError(
                        `Failed to convert entry template. Status: ${response.status}. ${errorMessage}`,
                        response.status,
                    );
                }
                console.log(
                    `Client: Entry ID "${entryId}" template successfully converted to "${targetEntryType}".`,
                );
            } catch (error) {
                console.error(
                    `Client: Error converting entry ID "${entryId}" template:`,
                    error,
                );
                throw error;
            }
        },

        /**
         * Searches for entries based on a query term using the server-side utility.
         * @param {string} query The search term.
         * @returns {Promise<SearchResults>} An object containing categorized lists of matching entries.
         */
        searchEntries: async (query: string): Promise<SearchResults> => {
            try {
                const response = await fetch(
                    `/api/entries/search?query=${encodeURIComponent(query)}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    },
                );

                if (!response.ok) {
                    const errorData: ApiErrorResponse = await response.json();
                    throw new HttpError(
                        errorData.message || "Failed to search entries",
                        response.status,
                    );
                }

                return await response.json();
            } catch (error) {
                console.error("Client: Error searching entries:", error);
                throw error;
            }
        },
    };
}