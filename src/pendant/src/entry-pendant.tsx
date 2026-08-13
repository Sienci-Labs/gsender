import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";

import { store as reduxStore } from "app/store/redux";
import { sagaMiddleware } from "app/store/redux/sagas";
import controller from "app/lib/controller";
import { FocusTrappingProvider } from "app/lib/focus-trapping";
import { getHost } from "./electron-bridge";
import * as pendantSagas from "./pendant-sagas";
import PendantShell from "./PendantShell";

import "./index.css";

sagaMiddleware.run(pendantSagas.initialize);

async function bootstrap() {
	// In Electron, getHost() returns the embedded server's host.
	// In a browser, fall back to same-origin (connects to whatever served this page).
	const storedHost = await getHost();
	const host = storedHost ? `http://${storedHost}` : "";

	controller.connect(host, { query: "token=" });

	const root = document.getElementById("root");
	if (!root) return;

	ReactDOM.createRoot(root).render(
		<React.StrictMode>
			<ReduxProvider store={reduxStore}>
				<FocusTrappingProvider value={true}>
					<PendantShell />
				</FocusTrappingProvider>
			</ReduxProvider>
		</React.StrictMode>,
	);
}

bootstrap();
