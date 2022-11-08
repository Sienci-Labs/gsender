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
                label={({ dataEntry }) => Math.round(dataEntry.percentage) + '%'}
                labelStyle={defaultLabelStyle}
                data={data}
                radius={6}
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
