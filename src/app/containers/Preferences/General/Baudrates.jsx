import React from 'react';
import Select from 'react-select';
import map from 'lodash/map';
import styles from '../index.styl';

const defaultBaudrates = [
    250000,
    115200,
    57600,
    38400,
    19200,
    9600,
    2400
];

const Baudrates = ({ onChange, baudrate }) => {
    const renderBaudrate = (option) => {
        const style = {
            color: '#333',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
        };
        return (
            <div className={styles.inputText} style={style} title={option.label}>{option.label}</div>
        );
    };

    return (
        <div>
            <h4 className={styles.settingsSubtitle}>Baudrate</h4>
            <Select
                backspaceRemoves={false}
                className="sm"
                clearable={false}
                menuContainerStyle={{ zIndex: 5 }}
                name="baudrate"
                onChange={onChange}
                options={map(defaultBaudrates, (value) => ({
                    value: value,
                    label: Number(value).toString()
                }))}
                searchable={false}
                value={{ label: baudrate }}
                valueRenderer={renderBaudrate}
            />
        </div>

    );
};

export default Baudrates;
