import { render } from '@testing-library/react';
import type { PluginRecord } from '../../types';
import { getCapabilitiesForSource } from '../../utils/plugin-permissions';
import { PluginTabPanel } from '../PluginTabPanel';

jest.mock('app/lib/controller', () => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
}));
jest.mock('../../hooks/usePlugins', () => ({
    usePlugins: () => ({ plugins: [] }),
}));

const pluginRecord: PluginRecord = {
    id: 'com.example.tab',
    name: 'Tab Plugin',
    version: '1.0.0',
    engine: null,
    capabilities: {
        requestTypes: ['workspace:get:state'],
        topics: ['workspace'],
        allowedFunctions: [],
    },
    enabled: true,
    valid: true,
    errors: [],
    mountSlug: 'tab-plugin',
    mountRoute: '/plugins/tab-plugin',
    uiUrl: '/plugins/tab-plugin/index.html',
    contributions: [{ slot: 'tools-tab' }],
    description: '',
    permissions: [],
};

describe('PluginTabPanel', () => {
    it("registers the iframe window with the plugin's granted capabilities", () => {
        const { container } = render(
            <PluginTabPanel plugin={pluginRecord} isActive />,
        );

        const iframe = container.querySelector('iframe');
        expect(iframe).not.toBeNull();

        const capabilities = getCapabilitiesForSource(
            (iframe as HTMLIFrameElement).contentWindow,
        );
        // Without registration the bridge treats the iframe as unknown and
        // denies every request — tab-hosted plugins were always denied.
        expect(capabilities).not.toBeNull();
        expect(capabilities?.requestTypes.has('workspace:get:state')).toBe(
            true,
        );
        expect(capabilities?.topics.has('workspace')).toBe(true);
    });
});
