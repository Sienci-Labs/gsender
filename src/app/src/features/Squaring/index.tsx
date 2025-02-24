import Steps from './Steps';
import { SquaringProvider } from './context/SquaringContext';

const Squaring = () => {
    return (
        <SquaringProvider>
            <Steps />
        </SquaringProvider>
    );
};

export default Squaring;
