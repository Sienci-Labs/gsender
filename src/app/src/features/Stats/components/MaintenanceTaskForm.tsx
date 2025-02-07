export function MaintenanceTaskForm({ value = null }) {
    const hasValue = !!value;
    return (
        <>
            <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full px-3 mb-6 md:mb-0">
                    <label
                        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                        htmlFor="grid-task-name"
                    >
                        Task Name
                    </label>
                    <input
                        className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                        id="grid-task-name"
                        name="taskName"
                        type="text"
                        placeholder="New Task"
                        value={hasValue ? value.name : null}
                    />
                    <p className="text-gray-600 text-xs italic">
                        Keeping these unique makes it easier for you to remember
                        what it is you need to do.
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-1/2 md:w-1/2 px-3">
                    <label
                        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                        htmlFor="grid-start-range"
                    >
                        Task Start Range
                    </label>
                    <input
                        className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="grid-start-range"
                        name="startRange"
                        type="number"
                        placeholder="1"
                        value={hasValue ? value.rangeStart : null}
                    />
                </div>
                <div className="w-1/2 px-3">
                    <label
                        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                        htmlFor="grid-end-range"
                    >
                        Task End Range
                    </label>
                    <input
                        className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="grid-end-range"
                        name="endRange"
                        type="number"
                        placeholder="20"
                        value={hasValue ? value.rangeEnd : null}
                    />
                </div>
            </div>

            <div className="flex flex-wrap -mx-3 mb-2">
                <div className="w-full px-3 mb-6 md:mb-0">
                    <label
                        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                        htmlFor="grid-description"
                    >
                        Task Description
                    </label>
                    <textarea
                        name="description"
                        rows="10"
                        className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="grid-description"
                        value={hasValue ? value.description : null}
                        placeholder="What do I want to do"
                    />
                </div>
            </div>
        </>
    );
}
