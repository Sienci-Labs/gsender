import React from 'react';
import PropTypes from 'prop-types';

import SettingWrapper from '../components/SettingWrapper';
import HeaderArea from './HeaderArea';
import MainArea from './MainArea';

const About = ({ modalClose, active }) => {
    return (
        <SettingWrapper show={active}>
            <HeaderArea />

            <MainArea />
        </SettingWrapper>
    );
};
About.propTypes = {
    modalClose: PropTypes.func,
};

export default About;
