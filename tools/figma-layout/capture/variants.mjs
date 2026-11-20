/*
 * Pure helpers for the Storybook capture: which control values to try, and
 * how states are named. Kept apart from storybook.mjs so tests can import
 * them without starting a capture.
 */

// Component props are cycled in every combination (variant × size ×
// disabled) while that stays a reasonable number of states; beyond it, and
// for app state controls, one control changes at a time.
export const MATRIX_MAX = 36;

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// The arg sets to try for one story beyond its own. `controls` is
// [{ name, target, values, current }]; `target` is set for controls that
// drive app state (machine, workspace) rather than component props.
// With `everyCombination`, app state controls join the matrix too, so any
// mix of values picked in Figma has a captured state behind it.
export function planVariations(controls, matrixMax = MATRIX_MAX, everyCombination = false) {
    const props = controls.filter((c) => everyCombination || !c.target);
    const state = controls.filter((c) => !everyCombination && c.target);
    const plans = [];
    const oneAtATime = (list) => {
        for (const c of list)
            for (const v of c.values)
                if (!same(v, c.current)) plans.push({ [c.name]: v });
    };
    const combos = props.reduce((n, c) => n * c.values.length, 1);
    if (props.length > 1 && combos <= matrixMax) {
        let sets = [{}];
        for (const c of props)
            sets = sets.flatMap((s) =>
                c.values.map((v) => ({ ...s, [c.name]: v })),
            );
        for (const s of sets)
            if (!props.every((c) => same(s[c.name], c.current))) plans.push(s);
    } else {
        oneAtATime(props);
    }
    oneAtATime(state);
    return plans;
}

export const show = (v) =>
    v === undefined || v === null
        ? 'unset'
        : typeof v === 'object'
          ? JSON.stringify(v)
          : String(v);

// `=` and `,` delimit variant properties in Figma.
export const clean = (v) => String(v).replace(/[=,]/g, '-').trim() || 'unset';

// "app/src/features/Jogging" → "Features/Jogging". Titles a story sets
// itself ("Pendant/Carve/StatusBadge") are kept.
export function displayTitle(title) {
    const t = title
        .replace(/^app\/src\//, '')
        .replace(/^pendant\/src\//, 'Pendant/');
    return t.charAt(0).toUpperCase() + t.slice(1);
}

// Names each state `Story=Idle, machinePreset=alarm` and records which
// controls ended up as variant properties: only those the kept states
// actually differ in. Mutates and returns `component`, whose variants carry
// { story, controls, interaction?, base? } on the way in. `booleans` names the
// on/off controls.
export function nameVariants(component, controlNames, booleans = new Set()) {
    // An unset switch is off; say so, so Figma offers it as a toggle.
    const value = (v, name) => {
        const raw = v.controls[name];
        if (raw === undefined || raw === null)
            return booleans.has(name) ? 'false' : 'default';
        return clean(show(raw));
    };
    component.properties = ['Story'];
    for (const name of controlNames) {
        const values = new Set(component.variants.map((v) => value(v, name)));
        if (values.size > 1) component.properties.push(name);
    }
    if (component.variants.some((v) => v.interaction))
        component.properties.push('Interaction');
    const names = new Set();
    for (const v of component.variants) {
        v.values = {};
        for (const p of component.properties) {
            v.values[p] =
                p === 'Story'
                    ? clean(v.story)
                    : p === 'Interaction'
                      ? v.interaction || 'Default'
                      : value(v, p);
        }
        const rest = component.properties
            .slice(1)
            .map((p) => `, ${p}=${v.values[p]}`)
            .join('');
        // Two states can only share a name if something outside the
        // properties told them apart; keep both, numbered.
        let name = `Story=${v.values.Story}${rest}`;
        for (let i = 2; names.has(name); i++) {
            v.values.Story = `${clean(v.story)} ${i}`;
            name = `Story=${v.values.Story}${rest}`;
        }
        names.add(name);
        v.name = name;
        delete v.controls;
        delete v.interaction;
        delete v.base;
    }
    return component;
}
