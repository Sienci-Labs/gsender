import store from "app/store";
import pubsub from "pubsub-js";
import { useEffect } from "react";
import PlaceholderImage from "./images/placeholder.png";

export function VisualizerPlaceholder() {
	useEffect(() => {
		const token = pubsub.subscribe(
			"placeholder:invalidLines",
			(_msg: string, invalidLines: string[]) => {
				const showWarningsOnLoad = store.get(
					"widgets.visualizer.showWarning",
					false,
				);
				if (showWarningsOnLoad && invalidLines.length > 0) {
					const lineSample = invalidLines.slice(0, 5);
					const description = (
						<div className={"flex flex-col gap-2"}>
							<p>
								Detected {invalidLines.length} invalid lines on file load. Your
								job may not run correctly.
							</p>
							<p>Sample invalid lines found include:</p>
							<ol>
								{lineSample.map((line, i) => (
									<li className="text-xs" key={i}>
										-<b> {line}</b>
									</li>
								))}
							</ol>
						</div>
					);
					pubsub.publish("helper:info", {
						title: "Invalid Lines Detected",
						description,
					});
				}
			},
		);

		return () => {
			pubsub.unsubscribe(token);
		};
	}, []);
	return (
		<div className="bg-transparent w-full h-full flex items-center justify-center ">
			<img src={PlaceholderImage} alt={"Louis the dog placeholder"} />
		</div>
	);
}
