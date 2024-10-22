import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';

interface TabItem {
    label: string;
    content: React.ComponentType<{ isActive: boolean }>;
}

interface TabbedProps {
    items: TabItem[];
}

export const Tabs = ({ items = [] }: TabbedProps) => {
    const [activeTab, setActiveTab] = useState('');
    const tabsRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
        if (items.length > 0) {
            setActiveTab(items[0].label);
        }
        tabRefs.current = tabRefs.current.slice(0, items.length);
        checkScrollability();
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
            tabsRef.current.scrollLeft +=
                direction === 'left' ? -scrollAmount : scrollAmount;
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
                <div className="flex items-center absolute top-[-47px] left-0 right-0 z-10">
                    <button
                        className={`flex-shrink-0 p-1 rounded-full bg-transparent transition-colors duration-200 mr-2 ${
                            canScrollLeft
                                ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                : 'text-gray-200 cursor-not-allowed'
                        }`}
                        onClick={() => canScrollLeft && scrollTabs('left')}
                        disabled={!canScrollLeft}
                    >
                        <span>&#9664;</span>
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
                                    className={`flex-grow px-4 py-2 text-sm font-medium ${
                                        activeTab === item.label
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-600 border-b-2 border-transparent hover:text-gray-800'
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
                        className={`flex-shrink-0 p-1 rounded-full bg-transparent transition-colors duration-200 ml-2 ${
                            canScrollRight
                                ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                : 'text-gray-200 cursor-not-allowed'
                        }`}
                        onClick={() => canScrollRight && scrollTabs('right')}
                        disabled={!canScrollRight}
                    >
                        <span>&#9654;</span>
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
