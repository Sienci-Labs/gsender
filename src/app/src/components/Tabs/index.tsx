import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdDragIndicator } from 'react-icons/md';
import { useLocation } from 'react-router';

interface TabItem {
    label: string;
    content: React.ComponentType<{ isActive: boolean }>;
}

interface TabbedProps {
    items: TabItem[];
}

export const Tabs = ({ items = [] }: TabbedProps) => {
    const [tabItems, setTabItems] = useState(items);
    const [activeTab, setActiveTab] = useState(items[0]?.label);
    const tabsRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setTabItems(items);
    }, [items]);

    useEffect(() => {
        const { pathname } = location;
        if (pathname === '/') {
            scrollToTab(tabItems.findIndex((value) => value.label === activeTab)); // scroll to correct tab on navigating to carve
        }
    }, [location, tabItems, activeTab]);

    useEffect(() => {
        tabRefs.current = tabRefs.current.slice(0, tabItems.length);
        checkScrollability();

        window.addEventListener('resize', checkScrollability);

        // if the active tab doesnt exist in the tabs list anymore, default to first tab
        if (!tabItems.find((value) => value.label === activeTab)) {
            setActiveTab(tabItems[0]?.label);
        }
    }, [tabItems, activeTab]);

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

    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const reorderedItems = Array.from(tabItems);
        const [reorderedItem] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, reorderedItem);

        setTabItems(reorderedItems);
    };

    return (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="w-full">
                <div className="relative">
                    <div className="flex items-center absolute top-[-41px] left-0 right-0 z-10">
                        <button
                            className={`flex-shrink-0 p-1 rounded-full bg-transparent transition-colors duration-200 max-xl:pt-2 ${
                                canScrollLeft
                                    ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-dark-lighter dark:text-gray-300 dark:hover:text-gray-100'
                                    : 'text-gray-200 cursor-not-allowed dark:text-gray-500'
                            }`}
                            onClick={() => canScrollLeft && scrollTabs('left')}
                            disabled={!canScrollLeft}
                        >
                            <MdKeyboardArrowLeft className="w-6 h-6" />
                        </button>
                        <Droppable droppableId="tabs" direction="horizontal">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={(el) => {
                                        provided.innerRef(el);
                                        tabsRef.current = el;
                                    }}
                                    className="flex overflow-x-auto flex-grow"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                    }}
                                    onScroll={checkScrollability}
                                >
                                    {tabItems.map((item, index) => (
                                        <Draggable key={item.label} draggableId={item.label} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={(el) => {
                                                        provided.innerRef(el);
                                                        tabRefs.current[index] = el;
                                                    }}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={provided.draggableProps.style}
                                                    className={`flex-shrink-0 min-w-fit pt-1 px-4 text-base font-medium max-xl:text-sm max-xl:pt-2 flex items-center justify-center gap-2 cursor-pointer ${
                                                        activeTab === item.label
                                                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                                            : 'text-gray-600 border-b-2 border-transparent hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'
                                                    } ${snapshot.isDragging ? 'bg-gray-100 dark:bg-dark-lighter' : ''}`}
                                                    onClick={() =>
                                                        handleTabClick(item.label, index)
                                                    }
                                                >
                                                    <MdDragIndicator className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                    {item.label}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        <button
                            className={`flex-shrink-0 p-1 rounded-full bg-transparent transition-colors duration-200 max-xl:pt-2 ${
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
                    {tabItems &&
                        tabItems.map(({ label, content: Content }) => (
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
        </DragDropContext>
    );
};

export default Tabs;
