/* eslint-disable quotes */
import React from 'react';
import classnames from 'classnames';
import ReactMarkdown from 'react-markdown';
import { team } from './tools';
import styles from './index.module.styl';

const releases = [];

const MainArea = () => {
    return (
        <div style={{ height: '540px' }}>
            <div className={styles.section} style={{ height: '10%' }}>
                <p style={{ marginTop: '1rem' }}>
                    gSender is a free GRBL CNC control software that is
                    Feature-packed and is designed to be clean and easy to learn
                    while retaining a depth of capabilities for advanced users.
                    It is made for out-of-the-box use on the LongMill CNC and
                    other GRBL-based machines and addition it has emphasis on
                    cross-system support, reliable operation, and great depth of
                    features.
                </p>
            </div>

            <div className={styles.section} style={{ height: '10%' }}>
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

            <div
                className={classnames(styles.section, styles.last)}
                style={{
                    height: '60%',
                    maxHeight: 'none',
                    marginBottom: '1rem',
                }}
            >
                <span
                    style={{
                        fontSize: '1.6rem',
                        position: 'relative',
                        bottom: '6px',
                    }}
                >
                    Release Notes:
                </span>
                <a
                    href="https://github.com/Sienci-Labs/gsender#-development-history"
                    target="_blank"
                    rel="noreferrer"
                    style={{ float: 'right' }}
                >
                    See all latest patch notes{' '}
                    <i className="fas fa-external-link-alt" />
                </a>
                <div className={styles.timeline} style={{ minHeight: '100%' }}>
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
