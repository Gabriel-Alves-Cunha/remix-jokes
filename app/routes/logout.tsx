import type { ActionFunction, LoaderFunction } from "@remix-run/node";

import { redirect } from "@remix-run/node";

import { logout } from "~/utils/session.server";

/**
 * Additionally, Remix will only re-call our loaders
 * when we perform an action, so if we used a loader
 * then the cache would not get invalidated. The loader
 * is just there in case someone somehow lands on that
 * page, we'll just redirect them back home.
 */

export const action: ActionFunction = async ({ request }) => {
	return logout(request);
};

export const loader: LoaderFunction = async () => {
	return redirect("/");
};
