import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './index.styl';


const Triangle = ({ children }) => (
    <div className={styles.triangle}>
        {children}
    </div>
);

const CirclePoint = ({ position, label, isActive }) => (
    <div className={classnames(styles.circlePoint, isActive ? styles.circlePointActive : '', styles[position])}>
        <span className={styles.circleLabel}>{label}</span>
    </div>
); CirclePoint.propTypes = { position: PropTypes.string, label: PropTypes.string, isActive: PropTypes.bool, };

const Arrow = ({ position, hasTop, hasBottom, label: Label, isActive, triangle, onTriangleChange }) => {
    const labelPosition = {
        diagonal: 'arrow-label-diagonal',
        bottom: 'arrow-label-bottom',
        left: 'arrow-label-left',
    }[position];

    return (
        <>
            { Label && <div className={classnames(styles[labelPosition])}>{typeof Label === 'string' ? Label : <Label triangle={triangle} onTriangleChange={onTriangleChange} />}</div> }
            <div className={classnames(styles.arrow, isActive ? styles.arrowActive : '', styles[`arrow-${position}`])}>
                { hasTop && <div className={classnames(styles.arrowHead, isActive ? styles.arrowHeadActive : '')} /> }
                <div className={classnames(styles.arrowBase)} />
                { hasBottom && <div className={classnames(styles.arrowTail, isActive ? styles.arrowTailActive : '')} /> }
            </div>
        </>
    );
};
Arrow.propTypes = {
    position: PropTypes.string,
    hasTop: PropTypes.bool,
    hasBottom: PropTypes.bool,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    isActive: PropTypes.bool,
};

const TriangleDiagram = ({ circlePoints, arrows, triangle, onTriangleChange }) => {
    return (
        <Triangle>
            {circlePoints.filter(point => point.show).map(point => (
                <CirclePoint
                    key={point.id}
                    position={point.position}
                    label={point.label}
                    isActive={point.isActive}
                />
            ))}

            {arrows.filter(arrow => arrow.show).map(arrow => (
                <Arrow
                    key={arrow.id}
                    label={arrow.label}
                    position={arrow.position}
                    hasTop={arrow.hasTop}
                    hasBottom={arrow.hasBottom}
                    isActive={arrow.isActive}
                    triangle={triangle}
                    onTriangleChange={onTriangleChange}
                />
            ))}
        </Triangle>
    );
};
TriangleDiagram.propTypes = { circlePoints: PropTypes.array, arrows: PropTypes.array };
TriangleDiagram.defaultProps = { circlePoints: [], arrows: [] };

export default TriangleDiagram;
