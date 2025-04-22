import { useEffect, useState } from 'react';
import { MaintenanceTask } from '../utils/StatContext';

interface Props {
    task?: MaintenanceTask;
}

export function MaintenanceTaskForm({ task }: Props) {
    const hasValue = !!task;
    const [name, setName] = useState(hasValue ? task.name : '');
    const [description, setDescription] = useState(
        hasValue ? task.description : '',
    );
    const [rangeStart, setRangeStart] = useState(
        hasValue ? task.rangeStart : 0,
    );
    const [rangeEnd, setRangeEnd] = useState(hasValue ? task.rangeEnd : 1);

    useEffect(() => {
        if (task) {
            setName(task.name);
            setDescription(task.description);
            setRangeStart(task.rangeStart);
            setRangeEnd(task.rangeEnd);
        }
    }, [task]);

    return (
        <>
            <div className="flex flex-wrap mb-6 w-full">
                <div className="w-full mb-6 md:mb-0">
                    <label
                        className="block mb-2"
                        htmlFor="grid-task-name dark:text-white"
                    >
                        Task Name
                    </label>
                    <input
                        className="border border-gray-300 w-full rounded-md py-3 px-4 mb-3 dark:text-white dark:bg-dark dark:border-dark-lighter" //"appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                        id="grid-task-name"
                        name="taskName"
                        type="text"
                        placeholder="New Task"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <p className="text-gray-600 text-xs italic dark:text-white">
                        Keeping these unique makes it easier for you to remember
                        what it is you need to do.
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap mb-6">
                <div className="w-1/2 md:w-1/2 pr-3">
                    <label
                        className="block mb-2 dark:text-white"
                        htmlFor="grid-start-range"
                    >
                        Task Start Range (Hrs)
                    </label>
                    <input
                        className="border border-gray-300 w-full rounded-md py-3 px-4 mb-3 dark:text-white dark:bg-dark dark:border-dark-lighter" //"appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="grid-start-range"
                        name="startRange"
                        type="number"
                        placeholder="1"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(Number(e.target.value))}
                    />
                </div>
                <div className="w-1/2 pl-3">
                    <label
                        className="block mb-2 dark:text-white"
                        htmlFor="grid-end-range"
                    >
                        Task End Range (Hrs)
                    </label>
                    <input
                        className="border border-gray-300 w-full rounded-md py-3 px-4 mb-3 dark:text-white dark:bg-dark dark:border-dark-lighter" //"appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="grid-end-range"
                        name="endRange"
                        type="number"
                        placeholder="20"
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="flex flex-wrap mb-2">
                <div className="w-full mb-6 md:mb-0">
                    <label
                        className="block mb-2 dark:text-white"
                        htmlFor="grid-description"
                    >
                        Task Description
                    </label>
                    <textarea
                        name="description"
                        rows={10}
                        className="border border-gray-300 w-full rounded-md py-3 px-4 mb-3 dark:text-white dark:bg-dark dark:border-dark-lighter" //"appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="grid-description"
                        value={description}
                        placeholder="What do I want to do"
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>
        </>
    );
}
