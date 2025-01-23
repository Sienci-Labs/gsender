import Steps from './Steps';
import { SquaringProvider } from './context/SquaringContext';

const Squaring = () => {
    return (
        <SquaringProvider>
            <h1 className="text-2xl font-bold my-4">XY Squaring</h1>
            <Steps />
        </SquaringProvider>
    );
};

export default Squaring;
