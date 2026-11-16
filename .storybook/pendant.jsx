import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';
import { useLayoutEffect } from 'react';
import { spyOn } from 'storybook/test';
import appStore from 'app/store';
import controller from 'app/lib/controller';
import { WizardProvider } from 'app/features/Helper/context';
import { FocusTrappingProvider } from 'app/lib/focus-trapping';
import { PRESETS } from './machine-state';
import { stateFromArgs } from './machine-args';
import pendantCss from './pendant.css?inline';

// The tablet the carve redesign targets (CARVE_REDESIGN_SPEC.md): portrait, 810x1080
export const TABLET = { width: 810, height: 1080 };

// Widths of the carve screen's two columns on that tablet (44% / 56%)
export const CARVE_LEFT = Math.round(TABLET.width * 0.44);
export const CARVE_RIGHT = TABLET.width - CARVE_LEFT;

const px = (value) => (typeof value === 'number' ? `${value}px` : value);

// What src/pendant/index.html and PendantShell set up around every pendant
// component: <html class="dark" data-dark-theme="workshop">, body.pendant-mode,
// the pendant stylesheet, and the wizard + focus-trapping providers. The html
// attributes are set for real (not only on a wrapper) so dialogs and menus
// portalled to <body> are themed too, and are restored when the story unmounts.
function PendantFrame({ width, height, padding, children }) {
    useLayoutEffect(() => {
        const html = document.documentElement;
        const hadDark = html.classList.contains('dark');
        const previousTheme = html.getAttribute('data-dark-theme');
        html.classList.add('dark');
        html.setAttribute('data-dark-theme', 'workshop');
        document.body.classList.add('pendant-mode');
        return () => {
            if (!hadDark) html.classList.remove('dark');
            if (previousTheme === null) {
                html.removeAttribute('data-dark-theme');
            } else {
                html.setAttribute('data-dark-theme', previousTheme);
            }
            document.body.classList.remove('pendant-mode');
        };
    }, []);

    return (
        <>
            <style data-pendant-styles="">{pendantCss}</style>
            <div
                className="dark flex flex-col bg-surface-base font-sans text-content-primary"
                data-dark-theme="workshop"
                data-testid="pendant-frame"
                style={{
                    width: px(width),
                    height: px(height),
                    padding: px(padding),
                }}
            >
                <FocusTrappingProvider value={true}>
                    <WizardProvider>{children}</WizardProvider>
                </FocusTrappingProvider>
            </div>
        </>
    );
}

// Decorator for every pendant story. Size the frame per file or per story with
// `parameters: { pendant: { width, height, padding } }` (numbers are px; any CSS
// length works). Defaults to the tablet's full width with no fixed height.
export const withPendant = (Story, { parameters }) => {
    const {
        width = TABLET.width,
        height,
        padding = 0,
    } = parameters.pendant ?? {};
    return (
        <PendantFrame width={width} height={height} padding={padding}>
            <Story />
        </PendantFrame>
    );
};

// Spread into a pendant story file's meta parameters: own iframe per story on
// Docs pages (the pendant stylesheet and <html> theme are page-wide), and no
// Storybook padding around the frame.
export const pendantParameters = {
    layout: 'fullscreen',
    docs: { story: { inline: false, height: '320px' } },
};

// `beforeEach` for stories that render the pendant's ConnectionWidget (the
// carve top bar's status badge). Unlike the rest of the pendant it keeps its
// connected/disconnected state locally: it connects by calling
// controller.openPort, and on mount auto-reconnects to the last port. This
// keeps it off the socket and, when the story's machine preset is a connected
// one, has that auto-reconnect succeed on `parameters.machine.port` (about
// half a second after mount), so the badge matches the machine state.
export function stubPendantConnection({ parameters, argsByTarget }) {
    const { machine } = stateFromArgs(parameters, argsByTarget);
    const { isConnected } = PRESETS[machine.preset ?? 'disconnected'];
    const port = machine.port ?? 'COM4';

    spyOn(controller, 'reconnect').mockImplementation(() => {});
    spyOn(controller, 'listPorts').mockImplementation(() => {});
    spyOn(controller, 'closePort').mockImplementation(() => {});
    spyOn(controller, 'openPort').mockImplementation(
        (_port, _options, callback) => callback(null),
    );

    appStore.replace('widgets.connection.autoReconnect', isConnected);
    appStore.replace('widgets.connection.port', isConnected ? port : '');
}
