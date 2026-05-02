import classNames from 'classnames';
import { tv, type VariantProps } from 'tailwind-variants';

export const spindleLaserStatusStyle = tv({
    base: 'text-white rounded-lg px-2 py-1 text-xs',
    variants: {
        color: {
            spindle: 'border-red-500 bg-red-500',
            laser: 'border-purple-500 bg-purple-500',
            disabled: 'border-gray-500 bg-gray-500',
        },
    },
    defaultVariants: {
        color: 'disabled',
    },
});

export type SpindleLaserStatusVariants = VariantProps<
    typeof spindleLaserStatusStyle
>;

export type SpindleLaserStatusProps = {
    label: string;
} & SpindleLaserStatusVariants;

export const SpindleLaserStatusVariant = (props: SpindleLaserStatusProps) => {
    return (
        <span className={spindleLaserStatusStyle(props)}>
            {props.label}
            <span
                className={classNames('ml-1 rounded-lg border-2 border-white')}
            >
                <span className="p-1">
                    {props.color === 'disabled' ? 'OFF' : 'ON'}
                </span>
            </span>
        </span>
    );
};
