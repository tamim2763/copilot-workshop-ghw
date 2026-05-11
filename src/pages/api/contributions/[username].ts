import type { APIRoute } from 'astro';

export const prerender = false;

const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8_000;
const SUCCESS_CACHE_CONTROL = 'public, max-age=60, s-maxage=600, stale-while-revalidate=300';

const usernamePattern = /^(?!-)(?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){1,39}$/;

type CacheEntry = {
	data: unknown;
	expiresAt: number;
};

type UpstreamResult =
	| { ok: true; data: unknown }
	| { ok: false; status: number; code: string; message: string };

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<UpstreamResult>>();

const buildJsonResponse = (body: unknown, status: number, headers: Record<string, string>): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
	});

const buildErrorResponse = (status: number, code: string, message: string): Response =>
	buildJsonResponse(
		{
			error: { code, message },
		},
		status,
		{ 'Cache-Control': 'no-store' },
	);

const fetchContributions = async (username: string): Promise<UpstreamResult> => {
	const url = `https://github.com/${encodeURIComponent(username)}.contribs`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const upstream = await fetch(url, {
			headers: { Accept: 'application/json' },
			signal: controller.signal,
		});

		if (upstream.status === 404) {
			return {
				ok: false,
				status: 404,
				code: 'USER_NOT_FOUND',
				message: 'GitHub user not found.',
			};
		}

		if (!upstream.ok) {
			return {
				ok: false,
				status: 502,
				code: 'UPSTREAM_ERROR',
				message: `GitHub upstream returned status ${upstream.status}.`,
			};
		}

		let data: unknown;
		try {
			data = await upstream.json();
		} catch {
			return {
				ok: false,
				status: 502,
				code: 'UPSTREAM_FAILURE',
				message: 'GitHub upstream response was not valid JSON.',
			};
		}

		return { ok: true, data };
	} catch (error: unknown) {
		if (error instanceof Error && error.name === 'AbortError') {
			return {
				ok: false,
				status: 502,
				code: 'UPSTREAM_FAILURE',
				message: 'GitHub upstream request timed out.',
			};
		}

		return {
			ok: false,
			status: 502,
			code: 'UPSTREAM_FAILURE',
			message: 'GitHub upstream request failed.',
		};
	} finally {
		clearTimeout(timeout);
	}
};

const getOrFetchContributions = async (cacheKey: string): Promise<UpstreamResult> => {
	const existing = inflightRequests.get(cacheKey);
	if (existing) {
		return existing;
	}

	const promise = fetchContributions(cacheKey);
	inflightRequests.set(cacheKey, promise);

	try {
		return await promise;
	} finally {
		inflightRequests.delete(cacheKey);
	}
};

export const GET: APIRoute = async ({ params }) => {
	const rawUsername = params.username?.trim();

	if (!rawUsername) {
		return buildErrorResponse(400, 'INVALID_USERNAME', 'Username is required.');
	}

	if (!usernamePattern.test(rawUsername)) {
		return buildErrorResponse(400, 'INVALID_USERNAME', 'Username format is invalid.');
	}

	const cacheKey = rawUsername.toLowerCase();
	const cached = responseCache.get(cacheKey);
	const now = Date.now();

	if (cached && cached.expiresAt > now) {
		return buildJsonResponse(cached.data, 200, {
			'Cache-Control': SUCCESS_CACHE_CONTROL,
			'X-Cache': 'HIT',
		});
	}

	if (cached && cached.expiresAt <= now) {
		responseCache.delete(cacheKey);
	}

	const result = await getOrFetchContributions(cacheKey);
	if (!result.ok) {
		return buildErrorResponse(result.status, result.code, result.message);
	}

	responseCache.set(cacheKey, {
		data: result.data,
		expiresAt: now + CACHE_TTL_MS,
	});

	return buildJsonResponse(result.data, 200, {
		'Cache-Control': SUCCESS_CACHE_CONTROL,
		'X-Cache': 'MISS',
	});
};
