import type { ActionFunction, LoaderFunction } from "@remix-run/node";

import { json, redirect } from "@remix-run/node";
import { Link, useActionData, useCatch, useTransition } from "@remix-run/react";

import { getUserID, requireUserID } from "~/utils/session.server";
import { db } from "~/utils/db.server";
import { JokeDisplay } from "~/components/joke";

function validateJokeContent(content: string) {
	if (content.length < 10)
		return `That joke is too short`;
}

function validateJokeName(name: string) {
	if (name.length < 3)
		return `That joke's name is too short`;
}

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const userId = await requireUserID(request);
	const form = await request.formData();

	const content = form.get("content");
	const name = form.get("name");

	if (typeof name !== "string" || typeof content !== "string")
		return badRequest({ formError: `Form not submitted correctly.` });

	const fieldErrors = {
		content: validateJokeContent(content),
		name: validateJokeName(name),
	};

	const fields = { name, content };

	if (Object.values(fieldErrors).some(Boolean))
		return badRequest({ fieldErrors, fields });

	const joke = await db.joke.create({ data: { ...fields, userId } });

	return redirect(`/jokes/${joke.id}`);
};

export const loader: LoaderFunction = async ({ request }) => {
	const userId = await getUserID(request);

	if (!userId)
		throw new Response("Unauthorized", { status: 401 });

	return json({});
};

export default function NewJokeRoute() {
	const actionData = useActionData<ActionData>();
	const transition = useTransition();

	if (transition.submission) {
		const content = transition.submission.formData.get("content");
		const name = transition.submission.formData.get("name");

		if (
			typeof name === "string" &&
			typeof content === "string" &&
			!validateJokeContent(content) &&
			!validateJokeName(name)
		)
			return (
				<JokeDisplay
					joke={{ name, content }}
					canDelete={false}
					isOwner={true}
				/>
			);
	}

	return (
		<div>
			<p>Add your own hilarious joke</p>

			<form method="post">
				<div>
					<label>
						Name:{" "}
						<input
							aria-errormessage={actionData?.fieldErrors?.name ?
								"name-error" :
								undefined}
							aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
							onChange={e => validateJokeName(e.target.value)}
							defaultValue={actionData?.fields?.name}
							type="text"
							name="name"
						/>
					</label>

					{actionData?.fieldErrors?.name !== undefined && (
						<p className="form-validation-error" role="alert" id="name-error">
							{actionData.fieldErrors.name}
						</p>
					)}
				</div>

				<div>
					<label>
						Content:{" "}
						<textarea
							aria-invalid={Boolean(actionData?.fieldErrors?.content) ||
								undefined}
							aria-errormessage={actionData?.fieldErrors?.content ?
								"content-error" :
								undefined}
							onChange={e => validateJokeContent(e.target.value)}
							defaultValue={actionData?.fields?.content}
							name="content"
						/>
					</label>

					{actionData?.fieldErrors?.content !== undefined && (
						<p
							className="form-validation-error"
							id="content-error"
							role="alert"
						>
							{actionData.fieldErrors.content}
						</p>
					)}
				</div>

				<div>
					{actionData?.formError !== undefined && (
						<p className="form-validation-error" role="alert">
							{actionData.formError}
						</p>
					)}

					<button type="submit" className="button">Add</button>
				</div>
			</form>
		</div>
	);
}

export function ErrorBoundary() {
	return (
		<div className="error-container">
			Something unexpected went wrong. Sorry about that.
		</div>
	);
}

export function CatchBoundary() {
	const caught = useCatch();

	if (caught.status === 401)
		return (
			<div className="error-container">
				<p>You must be logged in to create a joke.</p>

				<Link to="/login">Login</Link>
			</div>
		);
}

interface ActionData {
	fieldErrors?: { name: string | undefined; content: string | undefined; };
	fields?: { name: string; content: string; };
	formError?: string;
}
