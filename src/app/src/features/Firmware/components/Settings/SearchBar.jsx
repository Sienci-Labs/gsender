import React, { useContext } from 'react';

import Button from 'app/components/Button';

import { FirmwareContext } from '../../utils';

const SearchBar = () => {
    const { filterText, setFilterText } = useContext(FirmwareContext);

    return (
        <div className="grid grid-cols-[5fr_1fr]">
            <input
                className="form-control border border-gray-400 rounded-none rounded-l px-2 py-1"
                placeholder="Search Firmware Settings..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                type="text"
            />
            <Button
                onClick={() => setFilterText('')}
                disabled={!filterText}
                color="primary"
                className="rounded-none rounded-r"
            >
                Clear Search
            </Button>
        </div>
    );
};

export default SearchBar;
