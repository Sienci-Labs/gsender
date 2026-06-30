import * as Sentry from "@sentry/react";
import process from "process";
import pkg from "../package.json";

const env = process.env;
if (env.NODE_ENV === "production") {
	Sentry.init({
		dsn: env.SENTRY_DSN,
		sendDefaultPii: true,
		release: pkg.version,
	});
}
