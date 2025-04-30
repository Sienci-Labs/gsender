import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';

import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';

interface TabItem {
    label: string;
    content: React.ComponentType<{ isActive: boolean }>;
}

interface TabbedProps {
    items: TabItem[];
}

export const Tabs = ({ items = [] }: TabbedProps) => {
    const [activeTab, setActiveTab] = useState(items[0]?.label);
    const tabsRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
        tabRefs.current = tabRefs.current.slice(0, items.length);
        checkScrollability();

        window.addEventListener('resize', checkScrollability);
    }, [items]);

    const checkScrollability = () => {
        if (tabsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
        }
    };

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsRef.current) {
            const scrollAmount = 100;
            const newScrollLeft =
                tabsRef.current.scrollLeft +
                (direction === 'left' ? -scrollAmount : scrollAmount);
            tabsRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth',
            });
            checkScrollability();
        }
    };

    const scrollToTab = (index: number) => {
        const tab = tabRefs.current[index];
        if (tab && tabsRef.current) {
            const tabsRect = tabsRef.current.getBoundingClientRect();
            const tabRect = tab.getBoundingClientRect();

            if (
                tabRect.right > tabsRect.right ||
                tabRect.left < tabsRect.left
            ) {
                const scrollLeft = tab.offsetLeft - tabsRef.current.offsetLeft;
                tabsRef.current.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth',
                });
            }
            checkScrollability();
        }
    };

    const handleTabClick = (label: string, index: number) => {
        setActiveTab(label);
        scrollToTab(index);
    };

    return (
        <div className="w-full">
            <div className="relative">
                <div className="flex items-center absolute top-[-41px] left-0 right-0 z-10">
                    <button
                        className={`flex-shrink-0 p-1 rounded-full bg-transparent transition-colors duration-200 ${
                            canScrollLeft
                                ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-dark-lighter dark:text-gray-300 dark:hover:text-gray-100'
                                : 'text-gray-200 cursor-not-allowed dark:text-gray-500'
                        }`}
                        onClick={() => canScrollLeft && scrollTabs('left')}
                        disabled={!canScrollLeft}
                    >
                        <MdKeyboardArrowLeft className="w-6 h-6" />
                    </button>
                    <div
                        ref={tabsRef}
                        className="flex overflow-x-auto flex-grow"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                        onScroll={checkScrollability}
                    >
                        {items &&
                            items.map((item, index) => (
                                <button
                                    key={item.label}
                                    ref={(el) => (tabRefs.current[index] = el)}
                                    className={`flex-grow pt-1 px-4 text-lg font-medium ${
                                        activeTab === item.label
                                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                            : 'text-gray-600 border-b-2 border-transparent hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'
                                    }`}
                                    onClick={() =>
                                        handleTabClick(item.label, index)
                                    }
                                >
                                    {item.label}
                                </button>
                            ))}
                    </div>
                    <button
                        className={`flex-shrink-0 p-1 rounded-full bg-transparent transition-colors duration-200 ${
                            canScrollRight
                                ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-dark-lighter dark:text-gray-300 dark:hover:text-gray-100'
                                : 'text-gray-200 cursor-not-allowed dark:text-gray-500'
                        }`}
                        onClick={() => canScrollRight && scrollTabs('right')}
                        disabled={!canScrollRight}
                    >
                        <MdKeyboardArrowRight className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <div className="block w-full h-full">
                {items &&
                    items.map(({ label, content: Content }) => (
                        <div
                            key={label}
                            className={classNames(
                                'w-full h-full',
                                activeTab === label ? 'block' : 'hidden',
                            )}
                        >
                            <Content isActive={activeTab === label} />
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Tabs;
