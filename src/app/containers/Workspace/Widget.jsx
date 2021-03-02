import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import AxesWidget from 'app/widgets/Axes';
import ConsoleWidget from 'app/widgets/Console';
import GCodeWidget from 'app/widgets/GCode';
import GrblWidget from 'app/widgets/Grbl';
import JobStatusWidget from 'app/widgets/JobStatus';
import LaserWidget from 'app/widgets/Laser';
import LocationWidget from 'app/widgets/Location';
import MacroWidget from 'app/widgets/Macro';
import ProbeWidget from 'app/widgets/Probe';
import SpindleWidget from 'app/widgets/Spindle';
import CustomWidget from 'app/widgets/Custom';
import VisualizerWidget from 'app/widgets/Visualizer';
import WebcamWidget from 'app/widgets/Webcam';
import SecondaryFunctionality from 'app/widgets/SecondaryFunctionality';

const getWidgetByName = (name) => {
    return {
        'axes': AxesWidget,
        'console': ConsoleWidget,
        'gcode': GCodeWidget,
        'grbl': GrblWidget,
        'job_status': JobStatusWidget,
        'laser': LaserWidget,
        'location': LocationWidget,
        'macro': MacroWidget,
        'probe': ProbeWidget,
        'spindle': SpindleWidget,
        'custom': CustomWidget,
        'visualizer': VisualizerWidget,
        'webcam': WebcamWidget,
        'secondary': SecondaryFunctionality
    }[name] || null;
};

class WidgetWrapper extends PureComponent {
    widget = null;

    render() {
        const { widgetId } = this.props;

        if (typeof widgetId !== 'string') {
            return null;
        }

        // e.g. "webcam" or "webcam:d8e6352f-80a9-475f-a4f5-3e9197a48a23"
        const name = widgetId.split(':')[0];
        const Widget = getWidgetByName(name);

        if (!Widget) {
            return null;
        }

        return (
            <Widget
                {...this.props}
                ref={node => {
                    this.widget = node;
                }}
            />
        );
    }
}

WidgetWrapper.propTypes = {
    widgetId: PropTypes.string.isRequired
};

export default WidgetWrapper;
