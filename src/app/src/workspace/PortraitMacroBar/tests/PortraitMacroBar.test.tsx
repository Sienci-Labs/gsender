import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Test 1: SettingsMenu contains the portrait macro bar toggle
describe('Portrait macro bar setting', () => {
    test('SettingsMenu includes portraitMacroBar toggle', () => {
        const fs = require('fs');
        const path = require('path');
        const settingsPath = path.resolve(__dirname, '../../../features/Config/assets/SettingsMenu.ts');
        const content = fs.readFileSync(settingsPath, 'utf8');
        expect(content).toContain("key: 'workspace.portraitMacroBar'");
        expect(content).toContain('type: \'boolean\'');
        expect(content).toContain('portrait');
    });
});

// Test 2: Default state includes the setting
describe('Default state', () => {
    test('defaultState has portraitMacroBar set to false', () => {
        const { default: defaultState } = require('app/store/defaultState');
        expect(defaultState.workspace.portraitMacroBar).toBe(false);
    });
});

// Test 3: Workspace interface includes the type
describe('Workspace TypeScript interface', () => {
    test('definitions.ts declares portraitMacroBar as boolean', () => {
        const fs = require('fs');
        const path = require('path');
        const definitionsPath = path.resolve(
            __dirname,
            '../../definitions.ts',
        );
        const content = fs.readFileSync(definitionsPath, 'utf8');
        expect(content).toContain('portraitMacroBar: boolean');
    });
});

// Test 4: PortraitMacroBar component exists and exports correctly
describe('PortraitMacroBar module', () => {
    test('exports PortraitMacroBar as a named export', () => {
        const mod = require('../index');
        expect(typeof mod.PortraitMacroBar).toBe('function');
    });
});

// Test 5: Carve component imports and renders PortraitMacroBar
describe('Carve component integration', () => {
    test('Carve imports PortraitMacroBar', () => {
        const fs = require('fs');
        const path = require('path');
        const carvePath = path.resolve(
            __dirname,
            '../../Carve/index.tsx',
        );
        const content = fs.readFileSync(carvePath, 'utf8');
        expect(content).toContain("import { PortraitMacroBar } from '../PortraitMacroBar'");
        expect(content).toContain('<PortraitMacroBar />');
    });

    test('Carve uses flex-col in bottom section for macro bar layout', () => {
        const fs = require('fs');
        const path = require('path');
        const carvePath = path.resolve(
            __dirname,
            '../../Carve/index.tsx',
        );
        const content = fs.readFileSync(carvePath, 'utf8');
        expect(content).toContain('flex flex-col');
    });
});

// Test 6: PortraitMacroBar component structure
describe('PortraitMacroBar component structure', () => {
    test('uses useWorkspaceState for the toggle', () => {
        const fs = require('fs');
        const path = require('path');
        const componentPath = path.resolve(__dirname, '../index.tsx');
        const content = fs.readFileSync(componentPath, 'utf8');
        expect(content).toContain('useWorkspaceState');
        expect(content).toContain('portraitMacroBar');
    });

    test('polls for macro changes', () => {
        const fs = require('fs');
        const path = require('path');
        const componentPath = path.resolve(__dirname, '../index.tsx');
        const content = fs.readFileSync(componentPath, 'utf8');
        expect(content).toContain('setInterval');
        expect(content).toContain('fetchMacros');
    });

    test('returns null when not in portrait mode or disabled', () => {
        const fs = require('fs');
        const path = require('path');
        const componentPath = path.resolve(__dirname, '../index.tsx');
        const content = fs.readFileSync(componentPath, 'utf8');
        expect(content).toContain('if (!isPortrait || !enabled');
    });

    test('uses @dnd-kit for drag and drop', () => {
        const fs = require('fs');
        const path = require('path');
        const componentPath = path.resolve(__dirname, '../index.tsx');
        const content = fs.readFileSync(componentPath, 'utf8');
        expect(content).toContain('@dnd-kit/core');
        expect(content).toContain('@dnd-kit/sortable');
    });

    test('calls api.macros.fetch to load macros', () => {
        const fs = require('fs');
        const path = require('path');
        const componentPath = path.resolve(__dirname, '../index.tsx');
        const content = fs.readFileSync(componentPath, 'utf8');
        expect(content).toContain('api.macros.fetch');
    });

    test('calls api.macros.update for drag reordering', () => {
        const fs = require('fs');
        const path = require('path');
        const componentPath = path.resolve(__dirname, '../index.tsx');
        const content = fs.readFileSync(componentPath, 'utf8');
        expect(content).toContain('api.macros.update');
    });

    test('disables buttons when not connected', () => {
        const fs = require('fs');
        const path = require('path');
        const componentPath = path.resolve(__dirname, '../index.tsx');
        const content = fs.readFileSync(componentPath, 'utf8');
        expect(content).toContain('disabled={!canRun}');
    });

    test('uses fixed button height with text truncation', () => {
        const fs = require('fs');
        const path = require('path');
        const componentPath = path.resolve(__dirname, '../index.tsx');
        const content = fs.readFileSync(componentPath, 'utf8');
        expect(content).toContain('h-14');
        expect(content).toContain('line-clamp-2');
    });
});
