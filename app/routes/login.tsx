import type {
	ActionFunction,
	LinksFunction,
	MetaFunction,
} from "@remix-run/node";

import { useActionData, Link, useSearchParams } from "@remix-run/react";

import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";

import { createUserSession, login, register } from "~/utils/session.server";

import stylesUrl from "../styles/login.css";

export const links: LinksFunction = () => {
	return [{ rel: "stylesheet", href: stylesUrl }];
};

export const meta: MetaFunction = () => ({
	description: "Login to submit your own jokes to Remix Jokes!",
	title: "Remix Jokes | Login",
});

function validateUsername(username: unknown) {
	if (typeof username !== "string" || username.length < 3)
		return `Usernames must be at least 3 characters long`;
}

function validatePassword(password: unknown) {
	if (typeof password !== "string" || password.length < 6)
		return `Passwords must be at least 6 characters long`;
}

function validateUrl(url: any) {
	console.log(url);

	const urls = ["/jokes", "/", "https://remix.run"];

	if (urls.includes(url))
		return url;

	return "/jokes";
}

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const form = await request.formData();

	const loginType = form.get("loginType");
	const username = form.get("username");
	const password = form.get("password");

	const redirectTo = validateUrl(form.get("redirectTo") || "/jokes");

	if (
		typeof loginType !== "string" ||
		typeof username !== "string" ||
		typeof password !== "string" ||
		typeof redirectTo !== "string"
	)
		return badRequest({ formError: `Form not submitted correctly.` });

	const fields = { loginType, username, password };
	const fieldErrors = {
		username: validateUsername(username),
		password: validatePassword(password),
	};

	if (Object.values(fieldErrors).some(Boolean))
		return badRequest({ fieldErrors, fields });

	switch (loginType) {
		case "login": {
			// login to get the user
			// if there's no user, return the fields and a formError
			// if there is a user, create their session and redirect to /jokes
			const user = await login({ username, password });

			console.log({ user });

			if (user === null)
				return badRequest({
					formError: `Username/Password combination is incorrect`,
					fields,
				});

			// if there is a user, create their session and redirect to /jokes
			return createUserSession(user.id, redirectTo);
		}

		case "register": {
			const userExists = await db.user.findFirst({ where: { username } });

			if (userExists)
				return badRequest({
					formError: `User with username ${username} already exists`,
					fields,
				});

			const user = await register({ username, password });

			if (!user)
				return badRequest({
					formError: `Something went wrong trying to create a new user.`,
					fields,
				});

			return createUserSession(user.id, redirectTo);
		}

		default: {
			return badRequest({ fields, formError: `Login type invalid` });
		}
	}
};

export default function Login() {
	/** Notice in my solution I'm using useSearchParams to
	 * get the 'redirectTo' query parameter and putting that
	 * in a hidden input. This way our action can know where
	 * to redirect the user. This will be useful later when
	 * we redirect a user to the login page.
	 */
	const actionData = useActionData<ActionData>();
	const [searchParams] = useSearchParams();

	return (
		<div className="container">
			<div className="content" data-light="">
				<h1>Login</h1>

				<form method="post">
					<input
						value={searchParams.get("redirectTo") ?? undefined}
						name="redirectTo"
						type="hidden"
					/>

					<fieldset>
						<legend className="sr-only">Login or Register?</legend>

						<label>
							<input
								defaultChecked={!actionData?.fields?.loginType ||
									actionData?.fields?.loginType === "login"}
								name="loginType"
								value="login"
								type="radio"
							/>
							Login
						</label>
						<label>
							<input
								defaultChecked={actionData?.fields?.loginType === "register"}
								name="loginType"
								value="register"
								type="radio"
							/>

							Register
						</label>
					</fieldset>

					<div>
						<label htmlFor="username-input">Username</label>

						<input
							aria-errormessage={actionData?.fieldErrors?.username ?
								"username-error" :
								undefined}
							aria-invalid={Boolean(actionData?.fieldErrors?.username)}
							defaultValue={actionData?.fields?.username}
							id="username-input"
							name="username"
							type="text"
						/>

						{actionData?.fieldErrors?.username && (
							<p
								className="form-validation-error"
								id="username-error"
								role="alert"
							>
								{actionData.fieldErrors.username}
							</p>
						)}
					</div>
					<div>
						<label htmlFor="password-input">Password</label>

						<input
							aria-errormessage={actionData?.fieldErrors?.password ?
								"password-error" :
								undefined}
							aria-invalid={Boolean(actionData?.fieldErrors?.password) ||
								undefined}
							defaultValue={actionData?.fields?.password}
							id="password-input"
							name="password"
							type="password"
						/>

						{actionData?.fieldErrors?.password && (
							<p
								className="form-validation-error"
								id="password-error"
								role="alert"
							>
								{actionData.fieldErrors.password}
							</p>
						)}
					</div>

					<div id="form-error-message">
						{actionData?.formError && (
							<p className="form-validation-error" role="alert">
								{actionData.formError}
							</p>
						)}
					</div>

					<button type="submit" className="button">Submit</button>
				</form>
			</div>

			<div className="links">
				<ul>
					<li>
						<Link to="/">Home</Link>
					</li>

					<li>
						<Link to="/jokes">Jokes</Link>
					</li>
				</ul>
			</div>
		</div>
	);
}

interface ActionData {
	fieldErrors?: { username: string | undefined; password: string | undefined; };
	fields?: { loginType: string; username: string; password: string; };
	formError?: string;
}
