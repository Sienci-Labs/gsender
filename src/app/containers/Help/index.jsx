/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React from 'react';
import Modal from 'app/components/Modal';
import styles from './index.styl';

const REPORT_FORM_LINK = 'https://docs.google.com/forms/d/e/1FAIpQLScKf48OZEcqqkcQmmdVRAwCud-sfNDphNK3rbd7VdkqUJKTDA/viewform';
const DOCUMENTATION_LINK = 'https://resources.sienci.com/view/gs-using-gsender/';
const FORUM_LINK = 'https://forum.sienci.com/c/gsender/14';

const HelpModal = ({ modalClose }) => {
    return (
        <Modal onClose={modalClose}>
            <h1 className={styles.helpModalHeader}>gSender Help</h1>
            <div className={styles.helpModal}>
                <b><i className="fa fa-bug" />Do you want to submit a bug or feedback on the current version?</b>
                <p><a href={REPORT_FORM_LINK} target="_blank">&bull; Bugs and other feedback for the current beta version can be submitted here <i className="fa fa-external-link-alt" /></a></p>
                <b><i className="fa fa-book"/>Do you want to learn how to use a specific feature in gSender?</b>
                <p><a href={DOCUMENTATION_LINK} target="_blank">&bull; Documentation is constantly being updated and can be found here. <i className="fa fa-external-link-alt" /></a></p>
                <b><i className="fa fa-comments" /> Do you want to ask the community a question about gSender?</b>
                <p><a href={FORUM_LINK} target="_blank">&bull; Our helpful and friendly community members can be found here. <i className="fa fa-external-link-alt" /></a></p>
            </div>
        </Modal>
    );
};

export default HelpModal;
