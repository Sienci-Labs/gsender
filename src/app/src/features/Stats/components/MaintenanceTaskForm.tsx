import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { MaintenanceTask } from '../utils/StatContext';
import { ControlledInput } from 'app/components/ControlledInput';

interface Props {
    task?: MaintenanceTask;
}

export type MaintenanceTaskFormRef = {
    validate: () => boolean;
};

export const MaintenanceTaskForm = forwardRef<MaintenanceTaskFormRef, Props>(
    ({ task }, ref) => {
        const hasValue = !!task;
        const [name, setName] = useState(hasValue ? task.name : '');
        const [description, setDescription] = useState(
            hasValue ? task.description : '',
        );
        const [rangeStart, setRangeStart] = useState(
            hasValue ? task.rangeStart : 0,
        );
        const [rangeEnd, setRangeEnd] = useState(hasValue ? task.rangeEnd : 1);
        const [errors, setErrors] = useState({
            name: '',
            rangeStart: '',
            rangeEnd: '',
        });

        useEffect(() => {
            if (task) {
                setName(task.name);
                setDescription(task.description);
                setRangeStart(task.rangeStart);
                setRangeEnd(task.rangeEnd);
            }
        }, [task]);

        const validateName = (value: string) => {
            if (!value.trim()) {
                setErrors((prev) => ({
                    ...prev,
                    name: 'Task name is required',
                }));
                return false;
            }
            setErrors((prev) => ({ ...prev, name: '' }));
            return true;
        };

        const validateRange = (start: number, end: number) => {
            // Clear any previous errors
            setErrors((prev) => ({ ...prev, rangeStart: '', rangeEnd: '' }));

            if (isNaN(start) || start < 0) {
                setErrors((prev) => ({
                    ...prev,
                    rangeStart: 'Start range must be a valid number',
                }));
                return false;
            }

            if (isNaN(end) || end < 0) {
                setErrors((prev) => ({
                    ...prev,
                    rangeEnd: 'End range must be a valid number',
                }));
                return false;
            }

            if (end <= start) {
                setErrors((prev) => ({
                    ...prev,
                    rangeEnd: 'End range must be greater than start range',
                }));
                return false;
            }

            return true;
        };

        const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setName(value);
            if (errors.name) {
                validateName(value);
            }
        };

        const handleRangeStartChange = (
            e: React.ChangeEvent<HTMLInputElement>,
        ) => {
            const value = Number(e.target.value);
            setRangeStart(value);
            if (errors.rangeEnd || errors.rangeStart) {
                validateRange(value, rangeEnd);
            }
        };

        const handleRangeEndChange = (
            e: React.ChangeEvent<HTMLInputElement>,
        ) => {
            const value = Number(e.target.value);
            setRangeEnd(value);
            if (errors.rangeEnd || errors.rangeStart) {
                validateRange(rangeStart, value);
            }
        };

        // Expose validation method to parent
        useImperativeHandle(ref, () => ({
            validate: () => {
                const isNameValid = validateName(name);
                const isRangeValid = validateRange(rangeStart, rangeEnd);
                return isNameValid && isRangeValid;
            },
        }));

        return (
            <>
                <div className="flex flex-wrap mb-2 w-full">
                    <div className="w-full mb-4 md:mb-0">
                        <label
                            className="block mb-2"
                            htmlFor="grid-task-name dark:text-white"
                        >
                            Task Name
                        </label>
                        <ControlledInput
                            className={`border w-full rounded-md py-3 px-4 mb-1 dark:text-white text-black dark:bg-dark ${
                                errors.name
                                    ? 'border-red-500 dark:border-red-500'
                                    : 'border-gray-300 dark:border-dark-lighter'
                            }`}
                            id="grid-task-name"
                            name="taskName"
                            type="text"
                            placeholder="New Task"
                            value={name}
                            onChange={handleNameChange}
                            onBlur={() => validateName(name)}
                            required
                        />
                        {errors.name ? (
                            <p className="text-red-500 text-xs italic mb-2">
                                {errors.name}
                            </p>
                        ) : (
                            <p className="text-gray-600 text-xs italic dark:text-white mb-2">
                                Keeping these unique makes it easier for you to
                                remember what it is you need to do.
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap mb-2">
                    <div className="w-1/2 md:w-1/2 pr-3">
                        <label
                            className="block mb-2 dark:text-white"
                            htmlFor="grid-start-range"
                        >
                            Task Start Range (Hrs)
                        </label>
                        <ControlledInput
                            className={`border w-full rounded-md py-3 px-4 mb-1 dark:text-white text-black dark:bg-dark ${
                                errors.rangeStart
                                    ? 'border-red-500 dark:border-red-500'
                                    : 'border-gray-300 dark:border-dark-lighter'
                            }`}
                            id="grid-start-range"
                            name="startRange"
                            type="number"
                            placeholder="1"
                            value={rangeStart}
                            onChange={handleRangeStartChange}
                            onBlur={() => validateRange(rangeStart, rangeEnd)}
                            min={0}
                            required
                        />
                        {errors.rangeStart && (
                            <p className="text-red-500 text-xs italic mb-2">
                                {errors.rangeStart}
                            </p>
                        )}
                    </div>
                    <div className="w-1/2 pl-3">
                        <label
                            className="block mb-2 dark:text-white"
                            htmlFor="grid-end-range"
                        >
                            Task End Range (Hrs)
                        </label>
                        <ControlledInput
                            className={`border w-full rounded-md py-3 px-4 mb-1 dark:text-white text-black dark:bg-dark ${
                                errors.rangeEnd
                                    ? 'border-red-500 dark:border-red-500'
                                    : 'border-gray-300 dark:border-dark-lighter'
                            }`}
                            id="grid-end-range"
                            name="endRange"
                            type="number"
                            placeholder="20"
                            value={rangeEnd}
                            onChange={handleRangeEndChange}
                            onBlur={() => validateRange(rangeStart, rangeEnd)}
                            min={1}
                            required
                        />
                        {errors.rangeEnd && (
                            <p className="text-red-500 text-xs italic mb-2">
                                {errors.rangeEnd}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap mb-2">
                    <div className="w-full mb-4 md:mb-0">
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
    },
);
