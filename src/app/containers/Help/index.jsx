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
import ToolModal from 'app/components/ToolModal/ToolModal';
import HelpCard from 'app/containers/Help/HelpCard';
import styles from './index.styl';


const REPORT_FORM_LINK = 'https://sienci.com/gsender-feedback/';
const DOCUMENTATION_LINK = 'https://resources.sienci.com/view/gs-using-gsender/';
const FORUM_LINK = 'https://forum.sienci.com/c/gsender/14';

const HelpModal = ({ modalClose }) => {
    return (
        <ToolModal
            onClose={modalClose}
            title="gSender Help"
        >
            <div className={styles.helpWrapper}>
                <div className={styles.helpModal}>
                    <HelpCard
                        link={REPORT_FORM_LINK}
                        title="Feedback"
                        text="Submit bugs or feedback about the current version of gSender."
                        linkText="Help us improve"
                        icon="fa-bug"
                    />
                    <HelpCard
                        link={DOCUMENTATION_LINK}
                        title="Documentation"
                        text="Learn about starting with gSender and how to use specific features."
                        linkText="Explore"
                        icon="fa-book"
                    />
                    <HelpCard
                        link={FORUM_LINK}
                        title="Community"
                        text="Our forums are a great place to go to have continued conversations with our friendly and helpful community."
                        linkText="Engage"
                        icon="fa-comments"
                    />
                </div>
            </div>
        </ToolModal>
    );
};

export default HelpModal;
