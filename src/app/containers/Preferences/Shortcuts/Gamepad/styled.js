import styled from 'styled-components';

const ProfileWrapper = styled.div`
    overflow-y: auto;
`;

const Header = styled.div`
    display: grid
    grid-template-columns: 1fr 13fr;
    align-items: center;
    margin: '0 0 0.5rem';
`;

const Table = styled.div`
    overflow-y: auto;
    height: 90%;
    background-color: white;
`;

const Name = styled.input`
    font-size: 1.5rem;
    height: 2.5rem;
    background-color: transparent;
    border: transparent;  
    transition: 250ms ease-in-out;
  
    &:focus-visible {
      background-color: white;
      border: 1px solid #ccc;
      outline: none;
    }
`;

ProfileWrapper.Header = Header;
ProfileWrapper.Table = Table;
ProfileWrapper.Name = Name;

export {
    ProfileWrapper
};
