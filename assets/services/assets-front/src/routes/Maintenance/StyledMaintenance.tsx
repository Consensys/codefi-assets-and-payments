import styled from 'styled-components';

import { colors } from 'constants/styles';

export default styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: ${colors.sidebarBackground};
  width: 100vw;
  height: 100vh;

  > img,
  > svg {
    display: block;
    width: 200px;
    margin-bottom: 20px;
  }

  > h2 {
    font-size: 18px;
    color: ${colors.sidebarText};
  }
`;
