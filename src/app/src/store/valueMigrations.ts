import {
    TOUCHPLATE_TYPE_3D,
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_BITZERO,
    TOUCHPLATE_TYPE_STANDARD,
    TOUCHPLATE_TYPE_ZERO,
} from 'app/lib/constants';
import get from 'lodash/get';
import set from 'lodash/set';

// Value-based migrations: fix old values by what they are, not by settings version.
// They run on any fully merged state (startup, remote sync, settings import), so they
// also cover exported files, which carry no version. Each one must be idempotent.
type ValueMigration = (state: any) => void;

// before 1.7 camera projection values were lowercase
const migrateProjection: ValueMigration = (state) => {
    const path = 'widgets.visualizer.projection';
    const projection = get(state, path);
    if (projection === 'perspective') {
        set(state, path, 'Perspective');
    } else if (projection === 'orthographic') {
        set(state, path, 'Orthographic');
    }
};

const VALID_TOUCHPLATE_TYPES = [
    TOUCHPLATE_TYPE_STANDARD,
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_ZERO,
    TOUCHPLATE_TYPE_3D,
    TOUCHPLATE_TYPE_BITZERO,
];

// older settings may store 'AutoZero Touchplate', which no longer matches any
// option and leaves the Config dropdown blank
const migrateTouchplateType: ValueMigration = (state) => {
    const path = 'workspace.probeProfile.touchplateType';
    const touchplateType = get(state, path);
    if (touchplateType === 'AutoZero Touchplate') {
        set(state, path, TOUCHPLATE_TYPE_AUTOZERO);
    } else if (!VALID_TOUCHPLATE_TYPES.includes(touchplateType)) {
        set(state, path, TOUCHPLATE_TYPE_STANDARD);
    }
};

const VALUE_MIGRATIONS: ValueMigration[] = [
    migrateProjection,
    migrateTouchplateType,
];

export const migrateValues = (state: any): any => {
    VALUE_MIGRATIONS.forEach((migrate) => migrate(state));
    return state;
};
