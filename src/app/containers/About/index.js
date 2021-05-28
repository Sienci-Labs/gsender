import React from 'react';
import classnames from 'classnames';

import Modal from 'app/components/PrimaryModal';
import logo from 'app/images/icon-round.png';
import canadaFlagIcon from 'app/images/canada-flag-icon.png';

import { version } from '../../../package.json';

import styles from './index.styl';
import { team, timeline } from './tools';

const TimelineItem = ({ date, text }) => {
    return (
        <div className={styles.timelineItem}>
            <div className={styles.timelineBubble}>
                {date}
            </div>
            <div className={styles.timelineText}>{text}</div>
        </div>
    );
};

const TimelineArrow = () => {
    return (
        <div className={styles.arrow}>
            <div className={styles.body} />
            <div className={styles.head} />
        </div>
    );
};

const About = ({ modalClose }) => {
    return (
        <Modal
            title="About"
            onClose={modalClose}
            size="lg"
        >
            <div className={styles.headerArea}>
                <div className={styles.headerLeft}>
                    <img src={logo} alt="" className={styles.logo} />
                    <div style={{ alignSelf: 'center' }}>
                        <h2 style={{ margin: 0 }}>gSender</h2>
                        <small>by Sienci Labs</small>
                        <p>Version {version}</p>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <p>Copyright &copy; 2021 Sienci Labs Inc.</p>
                    <div className={styles.country}><span>Made in Canada</span> <img src={canadaFlagIcon} alt="Canada Flag" /></div>
                    <p><a href="https://github.com/Sienci-Labs/sender/blob/master/LICENSE">GNU GPLv3 License</a></p>
                </div>
            </div>

            <div className={styles.section}>
                <h4>About gSender</h4>

                <p>
                    gSender is a a free GRBL CNC control software that is Feature-packed and is designed to be clean and easy to learn while retaining a depth of
                    capabilities for advanced users. It is made for out-of-the-box use on the LongMill CNC and other GRBL-based machines and addition it has
                    emphasis on cross-system support, reliable operation, and great depth of features.
                </p>
            </div>

            <div className={styles.section}>
                <h4>gSender Team</h4>

                <p>
                    {team.map(({ id, name, title, isLastInList }) => <span key={id}><strong>{name}</strong> ({title}){!isLastInList && ','} </span>)}
                </p>
            </div>

            <div className={classnames(styles.section, styles.last)}>
                <h4>Project Timeline</h4>

                <div className={styles.timeline}>
                    {
                        timeline.map(({ id, date, text, isLastInList }) => (
                            <React.Fragment key={id}>
                                <TimelineItem date={date} text={text} />
                                {!isLastInList && <TimelineArrow />}
                            </React.Fragment>
                        ))
                    }
                </div>
            </div>

        </Modal>
    );
};

export default About;
