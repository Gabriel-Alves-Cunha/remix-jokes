import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { compare, hash } from "bcryptjs";

import { db } from "./db.server";

export async function login({ username, password }: LoginForm) {
	const user = await db.user.findUnique({ where: { username } });

	console.log({ userAtServer: user, username, password });

	if (user === null) return null;

	const isCorrectPassword = await compare(password, user.passwordHash);

	if (isCorrectPassword === false) return null;

	return { id: user.id, username };
}

export async function register({ username, password }: LoginForm) {
	const passwordHash = await hash(password, 10);

	const user = await db.user.create({ data: { username, passwordHash } });

	return { id: user.id, username };
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret)
	throw new Error(
		"SESSION_SECRET is not set! One way you can get one is to type on your terminal: `uuid`.",
	);

const storage = createCookieSessionStorage({
	cookie: {
		// normally you want this to be `secure: true`
		// but that doesn't work on localhost for Safari
		// https://web.dev/when-to-use-local-https/
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60 * 24 * 30,
		secrets: [sessionSecret],
		name: "RJ_session",
		sameSite: "lax",
		httpOnly: true,
		path: "/",
	},
});

export async function getUser(req: Request) {
	const userId = await getUserID(req);

	if (typeof userId !== "string")
		return null;

	try {
		return await db.user.findUnique({
			select: { id: true, username: true },
			where: { id: userId },
		});
	} catch {
		throw logout(req);
	}
}

export async function logout(req: Request) {
	const session = await getUserSession(req);

	return redirect("/login", {
		headers: { "Set-Cookie": await storage.destroySession(session) },
	});
}

export async function createUserSession(userID: string, redirectTo: string) {
	const session = await storage.getSession();

	session.set("userID", userID);

	return redirect(redirectTo, {
		headers: { "Set-Cookie": await storage.commitSession(session) },
	});
}

function getUserSession(req: Request) {
	return storage.getSession(req.headers.get("Cookie"));
}

export async function getUserID(req: Request) {
	const session = await getUserSession(req);

	const userID = session.get("userID");

	if (!userID || typeof userID !== "string") return null;

	return userID;
}

/**
 * In my example, I created a requireUserId which
 * will throw a redirect. Remember redirect is a
 * utility function that returns a Response object.
 * Remix will catch that thrown response and send
 * it back to the client. It's a great way to
 * "exit early" in abstractions like this so users
 * of our requireUserId function can just assume
 * that the return will always give us the userId
 * and don't need to worry about what happens if
 * there isn't a userId because the response is
 * thrown which stops their code execution!
 */
export async function requireUserID(
	req: Request,
	redirectTo: string = new URL(req.url).pathname,
) {
	const session = await getUserSession(req);

	const userID = session.get("userID");

	if (!userID || typeof userID !== "string") {
		const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);

		throw redirect(`/login?${searchParams}`);
	}

	return userID;
}

interface LoginForm {
	username: string;
	password: string;
}
