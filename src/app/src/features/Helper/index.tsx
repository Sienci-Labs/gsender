import { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';
import cn from 'classnames';

export function Helper() {
    const minimized = useSelector((state: RootState) => state.helper.minimized);

    return (
        <div
            className={cn(
                'absolute top-0 left-0 w-full h-full bg-blue-400 rounded z-30',
                {
                    'opacity-0': minimized,
                },
            )}
        >
            hi
        </div>
    );
}
