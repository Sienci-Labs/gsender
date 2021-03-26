/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/tabindex-no-positive */
/* eslint-disable jsx-quotes */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

import React, { PureComponent } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import controller from 'app/lib/controller';
import styles from './index.styl';
import WarningModal from './WarningModal';


class Firmwareprofiles extends PureComponent {
    static propTypes = {
        modalClose: PropTypes.func
    };

    componentDidMount() {
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    controllerEvents = {
        'message': (files) => {
            if (files !== null) {
                this.actions.formatText(files);
                this.setState({ filesFound: true });
            } else {
                this.setState({ loadedFiles: 'Error loading files..' });
            }
        },
    };

   actions = {
       startFlash: () => {
           let port = controller.port;
           controller.command('firmware:getProfiles', port);
       },
       applySettings: () => {
           this.setState({ showWarningModal: true });
       },
       formatText: (files) => {
           let string;
           let formatted = [];
           files.forEach((e) => {
               string = e.toString().split('.').slice(0, -1).join('.');
               formatted.push(string);
           });
           this.setState({ loadedFiles: formatted });
           this.setState({ showHeader: true });
           this.setState({ showstartButton: false });
       },
       pickProfile: (event) => {
           let id = event.target.id;
           this.setState({ selectedProfile: id });
           this.setState({ showUploadButton: true });
       }
   };

   state = this.getInitialState();


   getInitialState() {
       return {
           loadedFiles: 'None Loaded',
           showUploadButton: false,
           filesFound: false,
           showstartButton: true,
           selectedProfile: '',
           showWarningModal: false
       };
   }


    render = () => {
        let loadedFiles = this.state.loadedFiles;
        return (
            <div className={classNames(
                styles.hidden,
                styles['settings-wrapper'],
                { [styles.visible]: this.props.active }
            )}
            >
                {this.state.showWarningModal ? <WarningModal port={controller.port} modalClose={this.props.modalClose} selectedProfile={this.state.selectedProfile} /> : ''}
                {this.state.showstartButton
                    ? (
                        <button
                            type="button"
                            onClick={this.actions.startFlash}
                        >Start
                        </button>
                    ) : ''
                }
                {this.state.showHeader ? (
                    <div>
                      Chose a machine profile to apply...
                    </div>
                ) : ''}
                {this.state.filesFound ? loadedFiles.map((item, i) => (
                    <li
                        key={item}
                        htmlFor={item}
                        id={item}
                        className={styles.firmwareprofiles} onClick={(event) => this.actions.pickProfile(event)}
                        tabIndex='1'
                    >{item}
                    </li>
                )) : 'No files loaded'}
                {this.state.showUploadButton ? (
                    <div>
                        <br />
                        <button
                            type="button"
                            onClick={this.actions.applySettings}
                        >Apply Settings
                        </button>
                    </div>
                ) : ''}
            </div>
        );
    };
}

export default Firmwareprofiles;
