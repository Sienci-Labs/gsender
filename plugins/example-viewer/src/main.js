import { gcode as gcodeClient, navigation } from '@sienci/gsender-plugin-sdk';
import { GCodeViewer } from '@sienci/gsender-plugin-sdk/viewer';

import { SAMPLE_GCODE } from './sample-gcode.js';
import './style.css';

const gcodeInput = document.getElementById('gcode-input');
const loadPreviewBtn = document.getElementById('load-preview');
const loadMainBtn = document.getElementById('load-main');
const goCarveBtn = document.getElementById('go-carve');
const statusEl = document.getElementById('status');
const viewerContainer = document.getElementById('viewer-container');

if (
    !gcodeInput ||
    !loadPreviewBtn ||
    !loadMainBtn ||
    !goCarveBtn ||
    !viewerContainer
) {
    throw new Error('Missing required DOM elements');
}

gcodeInput.value = SAMPLE_GCODE;

let viewer;

const initViewer = () => {
    viewer = new GCodeViewer({
        id: 'example-viewer-preview',
        container: viewerContainer,
    });
    // gviewer sizes from container.clientHeight; ensure layout is settled first.
    requestAnimationFrame(() => {
        viewer.resize();
    });
};

initViewer();

const setStatus = (message) => {
    if (!statusEl) return;

    statusEl.textContent = message;
};

const getGcode = () => gcodeInput.value.trim();

const loadPreview = async () => {
    const gcode = getGcode();
    if (!gcode) {
        setStatus('Enter some G-code first.');
        return;
    }

    setStatus('Loading preview…');
    try {
        await viewer.loadFromText(gcode);
        viewer.focusToModel();
        setStatus('Preview updated.');
    } catch (err) {
        setStatus(
            `Preview failed: ${err instanceof Error ? err.message : String(err)}`,
        );
    }
};

const loadToMain = async () => {
    const gcode = getGcode();
    if (!gcode) {
        setStatus('Enter some G-code first.');
        return;
    }

    setStatus('Sending to gSender…');
    try {
        await gcodeClient.loadToVisualizer(gcode, 'viewer-demo.nc');
        goCarveBtn.disabled = false;
        setStatus(
            "Loaded into gSender's main visualizer. Go to Carve to run it.",
        );
    } catch (err) {
        setStatus(
            `Load failed: ${err instanceof Error ? err.message : String(err)}`,
        );
    }
};

const goToCarve = async () => {
    try {
        await navigation.navigateToCarve();
    } catch (err) {
        setStatus(
            `Navigation failed: ${err instanceof Error ? err.message : String(err)}`,
        );
    }
};

loadPreviewBtn.addEventListener('click', () => {
    void loadPreview();
});

loadMainBtn.addEventListener('click', () => {
    void loadToMain();
});

goCarveBtn.addEventListener('click', () => {
    void goToCarve();
});

void loadPreview();

window.addEventListener('beforeunload', () => {
    viewer?.dispose();
});
