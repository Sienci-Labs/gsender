/*
    From: https://github.com/toomuchdesign/react-minimal-pie-chart/
*/

import React, { useState } from 'react';
import ReactTooltip from 'react-tooltip';
import { PieChart } from 'react-minimal-pie-chart';
import styles from '../index.styl';


const CustomPieChart = ({ propsData }) => {
    const [hovered, setHovered] = useState(null);
    const [selected, setSelected] = useState(0);
    const data = propsData.map((entry, i) => {
        if (hovered === i) {
            return {
                ...entry,
                color: 'grey',
            };
        }
        return entry;
    });

    const defaultLabelStyle = {
        fontSize: '5px',
        fontFamily: 'sans-serif',
    };

    const makeTooltipContent = (entry) => {
        return `Jobs ${entry.title}: ${entry.value}`;
    };

    return (
        <div data-tip="" data-for="chart">
            <PieChart
                label={({ dataEntry }) => {
                    const rounded = Math.round(dataEntry.percentage * 100) / 100;
                    if (rounded === 100) {
                        return rounded + '% ';
                    } else if (rounded === 0) {
                        return '';
                    } else {
                        return rounded + '%';
                    }
                }}
                labelStyle={defaultLabelStyle}
                data={data}
                radius={40}
                segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
                segmentsShift={(index) => (index === selected ? 6 : 1)}
                onClick={(event, index) => {
                    setSelected(index === selected ? undefined : index);
                }}
                onMouseOver={(_, index) => {
                    setHovered(index);
                }}
                onMouseOut={() => {
                    setHovered(null);
                }}
            />
            <ReactTooltip
                id="chart"
                className={styles.tooltip}
                getContent={() => {
                    return typeof hovered === 'number' ? makeTooltipContent(data[hovered]) : null;
                }}
            />
        </div>
    );
};

export default CustomPieChart;
