import React from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';
import uniqueId from 'lodash/uniqueId';

import Button from 'app/components/FunctionButton/FunctionButton';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';

import Line from './Line';
import { Container, GcodeContainer } from './styled';

const GcodeViewer = ({ gcode }) => {
    const handleCopy = throttle(async () => {
        await navigator.clipboard?.writeText(gcode);

        Toaster.pop({
            msg: 'Copied G-code to Clipboard',
            type: TOASTER_INFO
        });
    }, 2000, { trailing: false });

    if (!gcode) {
        return null;
    }

    return (
        <Container>
            <GcodeContainer>
                {
                    gcode.split('\n').map((line, i) => <Line key={`${uniqueId()}-${line}`} number={i + 1} text={line} />)
                }
            </GcodeContainer>
            <Button style={{ margin: 0 }} onClick={handleCopy}>
                <i className="fas fa-copy" /> Copy to Clipboard
            </Button>
        </Container>
    );
};

GcodeViewer.propTypes = {
    gcode: PropTypes.string,
};

export default GcodeViewer;
