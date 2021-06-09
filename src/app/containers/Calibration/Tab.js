import React from 'react';
import PropTypes from 'prop-types';

const Tab = ({ title, childComponent: ChildComponent, componentProps }) => (
    <div>
        {title && <h4>{title}</h4>}
        {ChildComponent && <ChildComponent {...componentProps} />}
    </div>
); Tab.propTypes = { title: PropTypes.string, childComponent: PropTypes.func, componentProps: PropTypes.object };

export default Tab;
