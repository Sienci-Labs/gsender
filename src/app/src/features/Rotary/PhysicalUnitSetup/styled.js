import styled from '@emotion/styled';

export const ContentWrapper = styled.div`
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
`;

export const Option = styled.div`
    opacity: ${(props) => (props.disabled ? '0' : '1')};
    display: flex;
    margin-top: 2rem;
`;

export const MenuTitle = styled.div`
    width: 50%;
`;

export const RadioWrapper = styled.div`
    margin-left: 1rem;
    display: flex;
    align-items: center;
`;

export const WarningBanner = styled.div`
    background-color: rgba(220, 38, 38, 0.9);
    padding: 1rem;
    margin-bottom: 0.75rem;
    color: white;
    text-align: center;
`;
