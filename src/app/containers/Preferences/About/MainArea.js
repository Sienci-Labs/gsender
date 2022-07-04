import React from 'react';
import classnames from 'classnames';
import ReactMarkdown from 'react-markdown';
import { team } from './tools';
import styles from './index.styl';
import releases from './releases.json';

const MainArea = () => {
    return (
        <div>
            <div className={styles.section}>
                <p style={{ marginTop: '1rem' }}>
                    gSender is a a free GRBL CNC control software that is
                    Feature-packed and is designed to be clean and easy to learn
                    while retaining a depth of capabilities for advanced users.
                    It is made for out-of-the-box use on the LongMill CNC and
                    other GRBL-based machines and addition it has emphasis on
                    cross-system support, reliable operation, and great depth of
                    features.
                </p>
            </div>

            <div className={styles.section}>
                <h3>gSender Team:</h3>

                <p>
                    {team.map(({ id, name, title, isLastInList }) => (
                        <span key={id}>
                            <strong>{name}</strong> ({title})
                            {!isLastInList && ','}{' '}
                        </span>
                    ))}
                </p>
            </div>

            <div className={classnames(styles.section, styles.last)}>
                <h3>Release Notes:</h3>

                <div className={styles.timeline}>
                    <div className={styles.timeline.content}>
                        {releases.map((element) => {
                            return (
                                <ReactMarkdown key={element}>
                                    {element}
                                </ReactMarkdown>
                            );
                        })}
                        <br />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainArea;

//command to remove new lines
//tr '\n' ' ' < temp.txt > releases.txt;
