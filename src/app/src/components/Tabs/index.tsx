import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { useLocation } from 'react-router';
import api from '../../api';

interface TabItem {
    label: string;
    content: React.ComponentType<{ isActive: boolean }>;
}

interface TabbedProps {
    items: TabItem[];
    tabSetId?: string;
}

export const Tabs = ({ items = [], tabSetId = 'default' }: TabbedProps) => {
    const [tabItems, setTabItems] = useState(items);
    const [activeTab, setActiveTab] = useState(items[0]?.label);
    const tabsRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const location = useLocation();

    const loadTabOrder = async () => {
        try {
            // Use the same key format as save
            const key = `tabOrder_${tabSetId}`;
            
            const response = await api.getState({ key });
            
            // The response.data might be an object with numeric keys or an array
            if (response.data) {
                let savedOrder;
                if (Array.isArray(response.data)) {
                    savedOrder = response.data;
                } else if (typeof response.data === 'object') {
                    // Convert object with numeric keys to array
                    savedOrder = Object.values(response.data);
                }
                
                
                if (savedOrder && Array.isArray(savedOrder)) {
                    const orderedItems = savedOrder
                        .map((label: string) => items.find(item => item.label === label))
                        .filter(Boolean);
                    
                    const newItems = items.filter(item => 
                        !savedOrder.includes(item.label)
                    );
                    
                    const finalOrder = [...orderedItems, ...newItems];
                    return finalOrder;
                }
            }
        } catch (error) {
            console.warn('Failed to load tab order:', error);
            // If we get a 404, try to save the current order first
            if (error.response?.status === 404) {
                await saveTabOrder(items);
            }
        }
        return items;
    };

    const saveTabOrder = async (newItems: TabItem[]) => {
        try {
            const tabOrder = newItems.map(item => item.label);
            // Use a simpler key format
            const key = `tabOrder_${tabSetId}`;
            const response = await api.setState({ [key]: tabOrder });
        } catch (error) {
            console.warn('Failed to save tab order:', error);
        }
    };

    useEffect(() => {
        const initializeTabs = async () => {
            const orderedItems = await loadTabOrder();
            setTabItems(orderedItems);
            
            // Set active tab to the first tab in the reordered list
            if (orderedItems.length > 0) {
                setActiveTab(orderedItems[0].label);
            }
        };
        
        if (items.length > 0) {
            initializeTabs();
        }
    }, [items, tabSetId]);

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
        saveTabOrder(reorderedItems);
    };

    return (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="w-full h-full flex flex-col">
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
                                                    className={`flex-grow pt-1 px-4 text-base font-medium max-xl:text-sm max-xl:pt-2 flex items-center justify-center cursor-pointer ${
                                                        activeTab === item.label
                                                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                                            : 'text-gray-600 border-b-2 border-transparent hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'
                                                    } ${snapshot.isDragging ? 'bg-gray-100 dark:bg-dark-lighter' : ''}`}
                                                    onClick={() =>
                                                        handleTabClick(item.label, index)
                                                    }
                                                >
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
