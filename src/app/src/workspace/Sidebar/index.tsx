import { NavBar } from 'app/features/navbar';
import { MinimizeHandle } from 'app/features/navbar/components/MinimizeHandle';
import { useState } from 'react';
import cx from 'classnames';

export const Sidebar = () => {
    const [show, setShow] = useState(true);
    return (
        <div className="border flex flex-col justify-end box-border">
            <NavBar show={show} />
            <MinimizeHandle
                className={cx('z-20', {
                    'absolute left-0 bottom-5 bg-white border-2 border-l-0 border-blue-500':
                        !show,
                })}
                onClick={() => setShow(!show)}
            />
        </div>
    );
};
