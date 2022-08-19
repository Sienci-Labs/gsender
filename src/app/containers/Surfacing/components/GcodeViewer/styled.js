import styled from 'styled-components';

export const Container = styled.div`
    overflow-y: scroll;
    height: 547px;
    background-color: white;
    border: 1px solid #eee;
`;

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 9fr;
`;

const Number = styled.span`
    margin: 0 0.75rem;
    color: rgba(0, 0, 0, 0.5);
    text-align: center;
`;

const Text = styled.code`
    user-select: text;
    border-radius: 0;
    height: 25px;
    padding-left: 0.5rem;
`;

export const StyledLine = {
    Wrapper,
    Number,
    Text
};
