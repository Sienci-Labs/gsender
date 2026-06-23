import { ErrorBoundary } from "@sentry/react";
import type { ReactNode } from "react";

type SentryConfigProps = {
	children: ReactNode;
};

const SentryConfig = ({ children }: SentryConfigProps) => {
	return (
		<ErrorBoundary fallback={<p>Something went wrong.</p>} showDialog={false}>
			{children}
		</ErrorBoundary>
	);
};

export default SentryConfig;
export { updateSentryConsent } from "./lib/sentry";
