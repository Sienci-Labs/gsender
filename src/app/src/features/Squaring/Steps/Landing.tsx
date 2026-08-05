/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import { useEffect } from "react";

interface Props {
	onComplete: () => void;
}

const Landing = ({ onComplete }: Props) => {
	useEffect(() => {
		onComplete();
	}, []);

	return (
		<div className="flex flex-col gap-4 xl:gap-0">
			<div className="space-y-12 text-sm xl:text-base font-normal">
				<div className="mb-2">
					To know how much adjustment is needed, follow the steps below.
					Prepare:
					<ul className="list-disc list-inside">
						<li>3 squares of tape marked with an &apos;X&apos;</li>
						<li>A long ruler or measuring tape</li>
						<li>
							Put something pointed in the spindle like an old v-bit, tapered
							bit, pencil, or a pointed dowel
						</li>
					</ul>
				</div>

				<p className="mb-2">
					Use the jog buttons to position your CNC near its front, left corner
					with the pointed tip almost touching the wasteboard, then continue
					below.
				</p>
			</div>
		</div>
	);
};

export default Landing;
