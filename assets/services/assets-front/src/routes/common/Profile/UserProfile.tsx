import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PageTitle from 'uiComponents/PageTitle';
import styled from 'styled-components';
import { Form, Select, Input } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';
import { LocaleContext } from 'common/i18n/I18nProvider';
import { DataCall } from 'utils/dataLayer';
import { IUser } from 'User';
import {
  API_CREATE_OR_UPDATE_CONFIG,
  API_UPDATE_USER,
} from 'constants/apiRoutes';
import { useIntl } from 'react-intl';
import { userProfileTexts } from 'texts/routes/userProfile';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { CommonTexts } from 'texts/commun/commonTexts';
import { mdiAlertOctagon } from '@mdi/js';
import { colors } from 'constants/styles';
import { setUser, userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

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
const StyledSelect = styled(Select)`
  max-width: 300px;
`;
interface IUserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  assetsLanguage?: string;
  regionalFormat?: string;
}

const UserProfile = () => {
  const user = useSelector(userSelector);
  const [form] = Form.useForm<IUserProfile>();
  const locale = React.useContext(LocaleContext);
  const [showSave, setShowSave] = React.useState(false);
  const [previewRegion, setPreviewRegion] = React.useState(locale.region);
  const dispatch = useDispatch();

  const intl = useIntl();

  React.useEffect(() => {
    setPreviewRegion(locale.region);
  }, [locale.region, locale.language]);

  const onValuesChange = (
    changedValues: IUserProfile,
    _values: IUserProfile,
  ) => {
    setShowSave(true);
    setPreviewRegion(changedValues.regionalFormat || locale.region);
  };

  const onFinish = async (values: IUserProfile) => {
    try {
      await DataCall({
        method: API_CREATE_OR_UPDATE_CONFIG.method,
        path: API_CREATE_OR_UPDATE_CONFIG.path(),
        urlParams: {
          userConfiguration: true,
        },
        body: {
          region: values.regionalFormat,
          language: values.assetsLanguage,
        },
      });
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(CommonTexts.error),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    } finally {
      locale.toggleLanguage(values.assetsLanguage);
      locale.toggleRegion(values.regionalFormat);
    }

    try {
      await DataCall({
        method: API_UPDATE_USER.method,
        path: API_UPDATE_USER.path(user?.id),
        body: {
          updatedParameters: {
            firstName: values.firstName,
            lastName: values.lastName,
          },
        },
      });

      dispatch(
        setUser({
          ...(user as IUser),
          firstName: values.firstName as string,
          lastName: values.lastName as string,
        }),
      );
    } catch (error) {
      console.log('ERROR', error);
    }
  };

  return (
    <ProfilePageWrapper>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          assetsLanguage: locale.language,
          regionalFormat: locale.region,
        }}
        onValuesChange={onValuesChange}
      >
        <PageTitle
          title={intl.formatMessage(userProfileTexts.title)}
          tabActions={
            showSave
              ? [
                  {
                    label: intl.formatMessage(userProfileTexts.save),
                    action: () => {
                      onFinish(form.getFieldsValue());
                      setShowSave(false);
                    },
                  },
                  {
                    label: intl.formatMessage(userProfileTexts.cancel),
                    action: () => {
                      form.resetFields();
                      setShowSave(false);
                    },
                    secondary: true,
                  },
                ]
              : []
          }
        />
        <main>
          <h2>{intl.formatMessage(userProfileTexts.generalTitle)}</h2>
          <div className="two-columns-wrapper">
            <Form.Item
              label={intl.formatMessage(userProfileTexts.firstName)}
              name="firstName"
              initialValue={user?.firstName}
              className="two-columns-item"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={intl.formatMessage(userProfileTexts.lastName)}
              name="lastName"
              initialValue={user?.lastName}
              className="two-columns-item"
            >
              <Input />
            </Form.Item>
          </div>
          <div className="two-columns-wrapper">
            <Form.Item
              label={intl.formatMessage(userProfileTexts.email)}
              initialValue={user?.email}
              name="email"
              className="two-columns-item"
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              label={'Role'}
              initialValue={user?.userType}
              name="userType"
              className="two-columns-item"
            >
              <Input disabled />
            </Form.Item>
          </div>
          <h2>{intl.formatMessage(userProfileTexts.languageAndRegionTitle)}</h2>
          <Form.Item
            label={intl.formatMessage(userProfileTexts.language)}
            name="assetsLanguage"
          >
            <StyledSelect
              suffixIcon={<CaretDownOutlined />}
              options={[
                {
                  label: 'English (UK)',
                  value: 'en',
                },
                {
                  label: 'Français',
                  value: 'fr',
                },
                {
                  label: '日本語',
                  value: 'ja',
                },
                {
                  label: 'Deutsch',
                  value: 'de',
                },
                {
                  label: 'Arabic (SA)',
                  value: 'ar-SA',
                },
              ]}
            />
          </Form.Item>
          <Form.Item label={intl.formatMessage(userProfileTexts.region)}>
            <div className="label_description">
              {intl.formatMessage(userProfileTexts.regionDesctiption)}
            </div>
            <Form.Item name="regionalFormat">
              <StyledSelect
                suffixIcon={<CaretDownOutlined />}
                options={[
                  {
                    label: intl.formatMessage(userProfileTexts.regionEnGB),
                    value: 'en-GB',
                  },
                  {
                    label: intl.formatMessage(userProfileTexts.regionEnUS),
                    value: 'en-US',
                  },
                  {
                    label: intl.formatMessage(userProfileTexts.regionFR),
                    value: 'fr-FR',
                  },
                  {
                    label: intl.formatMessage(userProfileTexts.regionJA),
                    value: 'ja-JA',
                  },
                  {
                    label: intl.formatMessage(userProfileTexts.regionDE),
                    value: 'de-DE',
                  },
                  {
                    label: intl.formatMessage(userProfileTexts.regionARSA),
                    value: 'ar-SA',
                  },
                ]}
              />
            </Form.Item>
            <div className="field_description_container">
              <div className="field_description">
                {intl.formatMessage(userProfileTexts.dateExample, {
                  dateExample: locale.formatDate(new Date(), previewRegion),
                })}
              </div>
              <div className="field_description">
                {intl.formatMessage(userProfileTexts.numberExample, {
                  numberExample: locale.formatNumber(1000000, previewRegion),
                })}
              </div>
              <div className="field_description">
                {intl.formatMessage(userProfileTexts.timeExample, {
                  timeExample: locale.formatTime(new Date(), previewRegion),
                })}
              </div>
            </div>
          </Form.Item>
        </main>
      </Form>
    </ProfilePageWrapper>
  );
};

export default UserProfile;
