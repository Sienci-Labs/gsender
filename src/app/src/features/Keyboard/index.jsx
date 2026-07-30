import { useEffect, useState } from 'react';
import KeyboardShortcuts from './Keyboard';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import pubsub from 'pubsub-js';

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
