import React, { useEffect } from 'react';
import useStayAwake from 'use-stay-awake';

const ScreenAwake = ({ children }) => {
    const device = useStayAwake();

    useEffect(() => {
        device.preventSleeping();
    }, []);

    return (
        <>
            { children }
        </>
    );
};

export default ScreenAwake;
