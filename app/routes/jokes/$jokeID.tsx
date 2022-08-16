import type { Joke } from "@prisma/client";
import type {
	ActionFunction,
	LoaderFunction,
	MetaFunction,
} from "@remix-run/node";

import { useCatch, useLoaderData, useParams } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";

import { getUserID, requireUserID } from "~/utils/session.server";
import { JokeDisplay } from "~/components/joke";
import { db } from "~/utils/db.server";

export const action: ActionFunction = async ({ request, params }) => {
	const form = await request.formData();

	if (form.get("_method") !== "delete")
		throw new Response(`The _method ${form.get("_method")} is not supported`, {
			status: 400,
		});

	const userID = await requireUserID(request);

	const joke = await db.joke.findUnique({ where: { id: params.jokeID } });

	if (joke === null)
		throw new Response("Can't delete what does not exist", { status: 404 });

	if (joke.userId !== userID)
		throw new Response("Pssh, nice try. That's not your joke", { status: 401 });

	await db.joke.delete({ where: { id: params.jokeID } });

	return redirect("/jokes");
};

export const loader: LoaderFunction = async ({ request, params }) => {
	const userID = await getUserID(request);

	const joke = await db.joke.findUnique({ where: { id: params.jokeID } });

	if (joke === null)
		throw new Response("What a joke! Not found.", { status: 404 });

	const data: LoaderData = { isOwner: userID === joke.userId, joke };

	return json(data);
};

export const meta: MetaFunction = (
	{ data }: { data: LoaderData | undefined; },
) => {
	if (!data)
		return { title: "No joke", description: "No joke found" };

	return {
		description: `Enjoy the "${data.joke.name}" joke and much more`,
		title: `"${data.joke.name}" joke`,
	};
};

export default function JokeRoute() {
	const data = useLoaderData<LoaderData>();

	return <JokeDisplay joke={data.joke} isOwner={data.isOwner} />;
}

export function ErrorBoundary() {
	const { jokeID } = useParams();

	return (
		<div className="error-container">
			{`There was an error loading joke by the id ${jokeID}. Sorry.`}
		</div>
	);
}

export function CatchBoundary() {
	const params = useParams();
	const caught = useCatch();

	switch (caught.status) {
		case 400:
			return (
				<div className="error-container">
					What you're trying to do is not allowed.
				</div>
			);

		case 404:
			return (
				<div className="error-container">
					Huh? What the heck is "{params.jokeID}"?
				</div>
			);

		case 401:
			return (
				<div className="error-container">
					Sorry, but {params.jokeID} is not your joke.
				</div>
			);

		default:
			throw new Error(`Unhandled error: ${caught.status}`);
	}
}

interface LoaderData {
	isOwner: boolean;
	joke: Joke;
}
