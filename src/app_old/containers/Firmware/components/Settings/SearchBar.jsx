import React, { useContext } from 'react';
import styled from 'styled-components';

import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import { FirmwareContext } from '../../utils';

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 5fr 1fr;
`;

const Input = styled.input`
    border: solid 1px #9ca3af;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
`;

const Button = styled(FunctionButton)`
    border-top-left-radius: 0;
    margin: 0px;
    border-bottom-left-radius: 0;
    border-left: none;
    box-shadow: none;
`;

const SearchBar = () => {
    const { filterText, setFilterText } = useContext(FirmwareContext);

    return (
        <Wrapper>
            <Input
                className="form-control"
                placeholder="Search Firmware Settings..."
                value={filterText} onChange={(e) => setFilterText(e.target.value)}
            />
            <Button onClick={() => setFilterText('')} disabled={!filterText}>Clear Search</Button>
        </Wrapper>
    );
};

export default SearchBar;
