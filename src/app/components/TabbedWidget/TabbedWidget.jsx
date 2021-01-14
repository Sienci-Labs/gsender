import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import WidgetStyles from '../Widget/index.styl';

class TabbedWidget extends PureComponent {
    static propTypes = {
        borderless: PropTypes.bool,
        fullscreen: PropTypes.bool
    };

    static defaultProps = {
        borderless: false,
        fullscreen: false
    };

    render() {
        const { borderless, fullscreen, className, ...props } = this.props;

        return (
            <div
                {...props}
                className={classNames(
                    className,
                    WidgetStyles.widget,
                    { [WidgetStyles.widgetBorderless]: borderless },
                    { [WidgetStyles.widgetFullscreen]: fullscreen }
                )}
            />
        );
    }
}

export default TabbedWidget;
