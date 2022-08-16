import type { LinksFunction, MetaFunction } from "@remix-run/node";

import {
	LiveReload,
	useCatch,
	Scripts,
	Outlet,
	Links,
	Meta,
} from "@remix-run/react";

import globalMediumStylesURL from "~/styles/global.css";
import globalLargeStylesURL from "~/styles/global.css";
import globalStylesURL from "~/styles/global.css";

// dprint-ignore
export const links: LinksFunction = () => [
	{ rel: "stylesheet", href: globalLargeStylesURL, media: "screen and (min-width: 1024px)" },
	{ rel:"stylesheet", href:globalMediumStylesURL, media: "print, (min-width: 640px)" },
	{ rel: "stylesheet", href: globalStylesURL },
];

export const meta: MetaFunction = () => {
	const description = "Learn Remix and laugh at the same time!";

	return {
		"twitter:image": "https://remix-jokes.lol/social.png",
		"twitter:card": "summary_large_image",
		"twitter:description": description,
		"twitter:creator": "@remix_run",
		"twitter:title": "Remix Jokes",
		"twitter:site": "@remix_run",
		keywords: "Remix,jokes",
		charset: "utf-8",
		description,
	};
};

function Document(
	{ children, title = `Remix: So great, it's funny!` }: {
		children: React.ReactNode;
		title?: string;
	},
) {
	return (
		<html lang="en">
			<head>
				<Meta />
				<title>{title}</title>
				<Links />
			</head>

			<body>
				{children}

				<Scripts />

				<LiveReload />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<Document>
			<Outlet />
		</Document>
	);
}

export function ErrorBoundary({ error }: { error: Error; }) {
	console.error(error);

	return (
		<Document title="Uh-oh!">
			<div className="error-container">
				<h1>App Error</h1>

				<pre>{error.message}</pre>
			</div>
		</Document>
	);
}

export function CatchBoundary() {
	const caught = useCatch();

	return (
		<Document title={`${caught.status} ${caught.statusText}`}>
			<div className="error-container">
				<h1>{caught.status} {caught.statusText}</h1>
			</div>
		</Document>
	);
}
