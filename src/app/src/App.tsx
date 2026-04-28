import controller from "app/lib/controller";
import * as user from "app/lib/user";
import store from "app/store";

import { store as reduxStore } from "app/store/redux";
import rootSaga, { sagaMiddleware } from "app/store/redux/sagas";
import { useEffect } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { HashRouter } from "react-router";
import { Toaster } from "./components/shadcn/Sonner";
import { AccessibilitySettingsHandler } from "./features/Helper/AccessibilitySettingsHandler";
import { ReactRoutes } from "./react-routes";

function App() {
	useEffect(() => {
		const token = store.get("session.token");
		user.signin({ token }).then((result) => {
			const { authenticated, token } = result as {
				authenticated: boolean;
				token: string;
			};

			if (!authenticated) return;

			const host = "";
			const options = { query: "token=" + token };

			controller.connect(host, options);
		});

		sagaMiddleware.run(rootSaga);
	}, []);

	return (
		<>
			<ReduxProvider store={reduxStore}>
				<AccessibilitySettingsHandler />
				<Toaster richColors closeButton theme="light" visibleToasts={5} />
				<HashRouter>
					<ReactRoutes />
				</HashRouter>
			</ReduxProvider>
		</>
	);
}

export default App;
