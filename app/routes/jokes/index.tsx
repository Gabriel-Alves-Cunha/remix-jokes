import type { LoaderFunction } from "@remix-run/node";
import type { Joke } from "@prisma/client";

import { useLoaderData, Link, useCatch } from "@remix-run/react";
import { json } from "@remix-run/node";

import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async () => {
	const count = await db.joke.count();

	const randomRowNumber = Math.floor(Math.random() * count);

	const [randomJoke] = await db.joke.findMany({
		skip: randomRowNumber,
		take: 1,
	});

	if (!randomJoke)
		throw new Response("No random joke found", { status: 404 });

	const data: LoaderData = { randomJoke };

	return json(data);
};

export default function JokesIndexRoute() {
	const data = useLoaderData<LoaderData>();

	return (
		<div>
			<p>Here's a random joke:</p>

			<p>{data.randomJoke.content}</p>

			<Link to={data.randomJoke.id}>"{data.randomJoke.name}" Permalink</Link>
		</div>
	);
}

export function ErrorBoundary() {
	return <div className="error-container">I did a whoopsies.</div>;
}

export function CatchBoundary() {
	const caught = useCatch();

	if (caught.status === 404)
		return <div className="error-container">There are no jokes to display.
		</div>;

	throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

interface LoaderData {
	randomJoke: Joke;
}
