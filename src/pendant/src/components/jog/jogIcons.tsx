import cn from 'classnames';

// Jog glyphs lifted from the desktop jog wheel's label SVGs
// (src/app/src/features/Jogging/assets/{labels,zLabels,aLabels}.svg) so the
// pendant matches desktop and reads differently from the plain go-to arrows in
// the Position tab. Each viewBox is cropped tight around its glyph so the icon
// fills the box it's given; one shape per family, rotated for each direction.

type IconProps = { className?: string };

// Solid block arrow pointing up (labels.svg Y+).
const BLOCK_ARROW =
    'M96.9665 4.37484L85.1665 16.1748C84.6651 16.6759 84.3236 17.3144 84.1852 18.0097C84.0468 18.705 84.1177 19.4256 84.389 20.0806L84.5108 20.3404C84.8113 20.9276 85.268 21.4206 85.8307 21.7648C86.3935 22.1091 87.0403 22.2913 87.7 22.2915H92.3332V34.8332C92.3332 35.7835 92.7107 36.695 93.3827 37.367C94.0547 38.039 94.9662 38.4165 95.9165 38.4165H103.083L103.352 38.4075C104.253 38.3397 105.096 37.9337 105.711 37.2708C106.325 36.6079 106.667 35.7372 106.667 34.8332L106.665 22.2915H111.3C112.008 22.2914 112.701 22.0811 113.29 21.6874C113.879 21.2936 114.338 20.734 114.61 20.0793C114.881 19.4247 114.952 18.7043 114.814 18.0093C114.675 17.3143 114.334 16.6759 113.833 16.1748L102.033 4.37484C101.361 3.70306 100.45 3.32568 99.4999 3.32568C98.5497 3.32568 97.6384 3.70306 96.9665 4.37484Z';

// Outlined triangle pointing up-left (labels.svg X−Y+ diagonal).
const DIAGONAL =
    'M51.7044 72.2928C51.9868 72.4102 52.2781 72.4538 52.5468 72.4188C52.8155 72.3839 53.0514 72.2718 53.2291 72.0946L70.73 54.5937C70.9062 54.4157 71.0174 54.1798 71.0516 53.9114C71.0859 53.6429 71.0419 53.3522 70.9244 53.0703C70.807 52.7884 70.6204 52.5262 70.3849 52.3117C70.1494 52.0972 69.8737 51.9386 69.5877 51.853L44.7505 44.5167C44.4965 44.4411 44.2423 44.4256 44.01 44.4717C43.7776 44.5178 43.574 44.6241 43.4167 44.7813C43.2594 44.9386 43.1532 45.1422 43.1071 45.3746C43.061 45.6069 43.0765 45.8611 43.1521 46.1152L50.4884 70.9523C50.5726 71.239 50.7305 71.5155 50.9449 71.7518C51.1593 71.9882 51.422 72.1753 51.7044 72.2928ZM46.8296 48.1942L66.4 53.9739L52.6093 67.7646L46.8296 48.1942Z';

// Chevron over a solid triangle, pointing up (zLabels.svg Z+).
const Z_CHEVRON = [
    'm9.6 29.22q0.21 0.25 0.5 0.4 0.29 0.14 0.61 0.17 0.32 0.02 0.63-0.08 0.31-0.1 0.55-0.31l14.11-12.09 14.11 12.09q0.24 0.22 0.55 0.33 0.32 0.11 0.65 0.09 0.32-0.02 0.62-0.16 0.3-0.15 0.51-0.4 0.21-0.25 0.32-0.57 0.1-0.31 0.07-0.64-0.04-0.33-0.19-0.62-0.16-0.29-0.42-0.5l-15.16-13c-0.3-0.25-0.67-0.39-1.06-0.39-0.39 0-0.76 0.14-1.06 0.39l-15.16 13c-0.33 0.28-0.53 0.68-0.57 1.11-0.03 0.43 0.11 0.86 0.39 1.18z',
    'm10.83 38.46q-0.51 0-0.93-0.29-0.41-0.3-0.59-0.77-0.18-0.48-0.05-0.98 0.13-0.49 0.52-0.82l15.16-13c0.3-0.25 0.67-0.39 1.06-0.39 0.39 0 0.76 0.14 1.06 0.39l15.16 13q0.39 0.33 0.52 0.82 0.13 0.5-0.05 0.98-0.18 0.47-0.59 0.77-0.42 0.29-0.93 0.29z',
];

// Rotary arrows (aLabels.svg): A+ is the top glyph, A− the bottom one.
const A_PLUS =
    'm17.4 24.39l-2.33-2.35c-1.49 1.92-2.42 4.14-2.7 6.44h3.34c0.24-1.44 0.82-2.85 1.69-4.09zm-1.69 7.4h-3.34c0.28 2.3 1.19 4.52 2.68 6.44l2.34-2.35c-0.86-1.24-1.44-2.63-1.68-4.09zm1.68 8.81c1.92 1.49 4.15 2.38 6.45 2.66v-3.36c-1.44-0.24-2.83-0.81-4.07-1.7zm9.77-23.6v-5.08l-7.53 7.53 7.53 7.37v-6.47c4.7 0.79 8.28 4.87 8.28 9.78 0 4.92-3.58 8.99-8.28 9.79v3.34c6.54-0.81 11.59-6.37 11.59-13.13 0-6.75-5.05-12.32-11.59-13.13z';
const A_MINUS =
    'm31.38 159.13l-7.54-7.54v5.08c-6.52 0.82-11.59 6.38-11.59 13.13 0 6.76 5.05 12.32 11.59 13.13v-3.34c-4.7-0.79-8.27-4.87-8.27-9.79 0-4.91 3.57-8.99 8.27-9.78v6.47zm7.26 9.03c-0.3-2.35-1.22-4.58-2.69-6.44l-2.35 2.35c0.9 1.24 1.46 2.65 1.69 4.09zm-11.47 11.42v3.35c2.3-0.28 4.53-1.18 6.45-2.67l-2.38-2.38c-1.24 0.89-2.63 1.47-4.07 1.7zm6.44-4.01l2.35 2.34c1.49-1.92 2.4-4.14 2.68-6.44h-3.34c-0.23 1.44-0.8 2.85-1.69 4.1z';

function Glyph({
    viewBox,
    paths,
    rotate = 0,
    className,
}: {
    viewBox: string;
    paths: string[];
    rotate?: 0 | 90 | 180 | 270;
    className?: string;
}) {
    return (
        <svg
            viewBox={viewBox}
            fill="currentColor"
            aria-hidden
            className={cn('shrink-0', className)}
            style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
        >
            {paths.map((d) => (
                <path key={d.slice(0, 24)} d={d} fillRule="evenodd" />
            ))}
        </svg>
    );
}

// Square crops centred on each glyph.
const ARROW_BOX = '80.5 1.9 38 38';
const DIAGONAL_BOX = '41.1 42.4 32 32';
const Z_BOX = '8 7.8 36 36';
const A_PLUS_BOX = '9.4 11.4 32.4 32.4';
const A_MINUS_BOX = '9.3 151.3 32.4 32.4';

const block = (rotate: 0 | 90 | 180 | 270) =>
    function BlockArrow({ className }: IconProps) {
        return (
            <Glyph
                viewBox={ARROW_BOX}
                paths={[BLOCK_ARROW]}
                rotate={rotate}
                className={className}
            />
        );
    };

const diagonal = (rotate: 0 | 90 | 180 | 270) =>
    function DiagonalArrow({ className }: IconProps) {
        return (
            <Glyph
                viewBox={DIAGONAL_BOX}
                paths={[DIAGONAL]}
                rotate={rotate}
                className={className}
            />
        );
    };

export const JogArrowUp = block(0);
export const JogArrowRight = block(90);
export const JogArrowDown = block(180);
export const JogArrowLeft = block(270);

export const JogArrowUpLeft = diagonal(0);
export const JogArrowUpRight = diagonal(90);
export const JogArrowDownRight = diagonal(180);
export const JogArrowDownLeft = diagonal(270);

export function JogZUp({ className }: IconProps) {
    return <Glyph viewBox={Z_BOX} paths={Z_CHEVRON} className={className} />;
}

export function JogZDown({ className }: IconProps) {
    return (
        <Glyph
            viewBox={Z_BOX}
            paths={Z_CHEVRON}
            rotate={180}
            className={className}
        />
    );
}

export function JogAPlus({ className }: IconProps) {
    return (
        <Glyph viewBox={A_PLUS_BOX} paths={[A_PLUS]} className={className} />
    );
}

export function JogAMinus({ className }: IconProps) {
    return (
        <Glyph viewBox={A_MINUS_BOX} paths={[A_MINUS]} className={className} />
    );
}
