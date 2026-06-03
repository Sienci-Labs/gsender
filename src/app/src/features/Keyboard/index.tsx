import { useTypedSelector } from 'app/hooks/useTypedSelector';
import KeyboardShortcuts from './Keyboard';

const Shortcuts = () => {
    const { isFinished } = useTypedSelector((state) => state.shortcuts);
    // const componentRef = useRef();

    return (
        <>
            {/* <ReactToPrint
                    trigger={() => (
                        <Button className="absolute top-5 left-[26em]">
                            Print
                        </Button>
                    )}
                    content={() => componentRef.current}
                />
                <div className="hidden">
                    <PrintableShortcuts ref={componentRef} />
                </div> */}

            {isFinished && <KeyboardShortcuts />}
        </>
    );
};

export default Shortcuts;
