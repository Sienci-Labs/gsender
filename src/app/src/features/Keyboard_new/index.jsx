import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';
import { Button } from 'react-bootstrap';

import PrintableShortcuts from './printableShortcuts';
import KeyboardShortcuts from './Keyboard';

const Shortcuts = () => {
    const componentRef = useRef();

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

            <KeyboardShortcuts />
        </>
    );
};

export default Shortcuts;
