import React from 'react';
import styled from 'styled-components';
import PageTitle from 'uiComponents/PageTitle';
import Layout from 'uiComponents/Layout';

const Explorer = () => {
  return (
    <Layout withAside={true}>
      <ProfilePageWrapper>
        <PageTitle title={'New App'} />
        <main>
          <div className="two-columns-wrapper"></div>
        </main>
      </ProfilePageWrapper>
    </Layout>
  );
};

const ProfilePageWrapper = styled.div`
  main {
    margin: 80px 32px;
    @media (min-width: 820px) {
      width: 600px;
      margin: 40px auto;
    }
    > h2 {
      border-bottom: 1px solid #dfe0e5;
      font-size: var(--typography-size-f4);
      font-weight: var(--typography-weight-medium);
      line-height: 150%;
      padding-bottom: 8px;
    }
    label {
      font-weight: 500;
      color: #1a2233;
    }
    .label_description {
      font-weight: 400;
      padding: 0 0 8px;
      color: #475166;
    }
    .field_description {
      font-weight: 400;
      padding: 8px 0 0;
      color: #475166;
    }
    .field_description_container {
      display: flex;
      flex-direction: column;
      @media (min-width: 820px) {
        gap: 24px;
        flex-direction: row;
      }
    }
    .two-columns-wrapper {
      display: flex;
      gap: 24px;
    }
    .two-columns-item {
      width: calc(50% - 12px);
    }
    .single-column-item {
      max-width: 400px;
    }
  }
`;

export default Explorer;
