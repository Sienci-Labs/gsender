import { expect, fireEvent, fn, spyOn, waitFor, within } from 'storybook/test';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import RecentRow from './RecentRow';

const DAY = 86400000;
const AGES = { today: 0, yesterday: DAY, older: 40 * DAY };

const meta = {
    title: 'Pendant/Carve/RecentRow',
    component: RecentRow,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '110px' } },
        pendant: { width: CARVE_LEFT, padding: 10 },
    },
    // `file` is flattened into the controls below and rebuilt in render
    args: {
        source: 'local',
        loadable: true,
        fileName: 'sign-pocket.nc',
        fileSize: 482304,
        loaded: 'today',
        onLoad: fn(),
    },
    argTypes: {
        source: {
            description:
                'Opened on this tablet, or received from a desktop via Send to Pendant',
            control: { type: 'inline-radio' },
            options: ['local', 'remote'],
        },
        loadable: {
            description:
                'Whether the tablet still has its copy of a local file (remote files always reload)',
            control: { type: 'boolean' },
        },
        fileName: { control: { type: 'text' } },
        fileSize: {
            description: 'Bytes',
            control: { type: 'number' },
        },
        loaded: {
            description: 'When the file was last loaded',
            control: { type: 'inline-radio' },
            options: Object.keys(AGES),
        },
        file: { table: { disable: true } },
    },
    render: ({ source, loadable, fileName, fileSize, loaded, ...args }) => (
        <div className="flex flex-col">
            <RecentRow
                {...args}
                file={{
                    fileName,
                    fileSize,
                    timeLoaded: Date.now() - AGES[loaded],
                    source,
                    // Outside Electron a local row reloads from the page's own copy
                    cacheKey:
                        source === 'local' && loadable
                            ? `${fileName}|${fileSize}|0`
                            : '',
                    savedName:
                        source === 'remote' ? `incoming-${fileName}` : '',
                }}
            />
        </div>
    ),
};

export default meta;

// See HoldButton.stories.jsx: clamps the hold's clock so it stops part-way
function freezeHoldAt(ms) {
    const raf = window.requestAnimationFrame.bind(window);
    const limit = performance.now() + ms;
    spyOn(window, 'requestAnimationFrame').mockImplementation((callback) =>
        raf((now) => callback(Math.min(now, limit))),
    );
}

const row = (canvas) => canvas.getByRole('button', { name: /^Hold to load/ });

export const Local = {
    play: async ({ canvas }) => {
        await expect(row(canvas)).toBeEnabled();
        await expect(canvas.getByText('471 KB · Today')).toBeVisible();
    },
};

export const ReceivedFromDesktop = {
    args: { source: 'remote', fileName: 'cabinet-door.gcode' },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByLabelText('Received from a desktop'),
        ).toBeVisible();
    },
};

export const LoadedYesterday = {
    args: { loaded: 'yesterday', fileSize: 2621440 },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('2.5 MB · Yesterday')).toBeVisible();
    },
};

export const LoadedEarlier = {
    args: { loaded: 'older', fileSize: 640 },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByText(/^640 B · [A-Z][a-z]{2} \d+$/),
        ).toBeVisible();
    },
};

export const LongFileName = {
    args: {
        fileName: 'kitchen-cabinet-door-left-roughing-pass-v12-final.gcode',
    },
    play: async ({ canvas }) => {
        const name = canvas.getByText(/^kitchen-cabinet/);
        // Truncated with an ellipsis rather than pushing the size off the row
        await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    },
};

// The tablet's copy is gone (storage cleared): dimmed, no ring, can't load
export const Unavailable = {
    args: { loadable: false },
    play: async ({ args, canvas }) => {
        const button = row(canvas);
        await expect(button).toBeDisabled();
        await fireEvent.pointerDown(button);
        await expect(args.onLoad).not.toHaveBeenCalled();
    },
};

// Held half-way: the fill has swept half the row and the ring is half closed
export const MidHold = {
    play: async ({ args, canvas }) => {
        freezeHoldAt(350);
        const button = row(canvas);
        await fireEvent.pointerDown(button);
        await waitFor(() =>
            expect(
                Number.parseFloat(
                    button.querySelector('span[aria-hidden]').style.width,
                ),
            ).toBeGreaterThan(40),
        );
        await expect(button).toHaveClass('border-blue-500/60');
        await expect(args.onLoad).not.toHaveBeenCalled();
    },
};

export const MidHoldReceivedFromDesktop = {
    args: { source: 'remote', fileName: 'cabinet-door.gcode' },
    play: MidHold.play,
};

export const HeldToLoad = {
    play: async ({ args, canvas }) => {
        await fireEvent.pointerDown(row(canvas));
        await waitFor(() =>
            expect(args.onLoad).toHaveBeenCalledWith(
                expect.objectContaining({ fileName: 'sign-pocket.nc' }),
            ),
        );
    },
};

export const TappedShowsHint = {
    play: async ({ args, canvas, canvasElement }) => {
        const button = row(canvas);
        await fireEvent.pointerDown(button);
        await fireEvent.pointerUp(button);
        const body = within(canvasElement.ownerDocument.body);
        await waitFor(() =>
            expect(body.getByRole('status')).toHaveTextContent('Hold to load'),
        );
        await expect(args.onLoad).not.toHaveBeenCalled();
    },
};
