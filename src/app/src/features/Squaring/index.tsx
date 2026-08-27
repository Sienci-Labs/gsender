import { SquaringProvider } from "./context/SquaringContext";
import Steps from "./Steps";

const Squaring = () => {
	return (
		<SquaringProvider>
			<Steps />
		</SquaringProvider>
	);
};

export default Squaring;
