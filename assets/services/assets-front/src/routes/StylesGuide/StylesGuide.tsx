import React, { useState } from 'react';
import {
  Switch,
  Route,
  Link,
  withRouter,
  RouteComponentProps,
} from 'react-router-dom';
import { mdiChevronDown, mdiChevronUp } from '@mdi/js';

import PageTitle from 'uiComponents/PageTitle';
import { Card as CardComponent } from 'uiComponents/Card';
import IconComponent from 'uiComponents/Icon';

import About from './showcasedComponents/About';
import AppMessagesGuide from './showcasedComponents/AppMessagesGuide';
import AppModalGuide from './showcasedComponents/AppModalGuide';
import AutosaveIndicatorGuide from './showcasedComponents/AutosaveIndicatorGuide';
import ButtonGuide from './showcasedComponents/ButtonGuide';
import CardGuide from './showcasedComponents/CardGuide';
import CheckboxGuide from './showcasedComponents/CheckboxGuide';
import ColorsGuide from './showcasedComponents/ColorsGuide';
import DataTableGuide from './showcasedComponents/DataTableGuide';
import ExpansionPanelGuide from './showcasedComponents/ExpansionPanelGuide';
import IconGuide from './showcasedComponents/IconGuide';
import IllustrationsGuide from './showcasedComponents/IllustrationsGuide';
import InputGroupGuide from './showcasedComponents/InputGroupGuide';
import InputGuide from './showcasedComponents/InputGuide';
import LoaderGuide from './showcasedComponents/LoaderGuide';
import LogoGuide from './showcasedComponents/LogoGuide';
import PageErrorGuide from './showcasedComponents/PageErrorGuide';
import PageLoaderGuide from './showcasedComponents/PageLoaderGuide';
import PageTitleGuide from './showcasedComponents/PageTitleGuide';
import PaginationGuide from './showcasedComponents/PaginationGuide';
import PillGuide from './showcasedComponents/PillGuide';
import ProgressBarGuide from './showcasedComponents/ProgressBarGuide';
import SelectGuide from './showcasedComponents/SelectGuide';
import RadioGuide from './showcasedComponents/RadioGuide';
import ShadowsGuide from './showcasedComponents/ShadowsGuide';
import SpacesGuide from './showcasedComponents/SpacesGuide';
import TypographyBodyGuide from './showcasedComponents/TypographyBodyGuide';
import TypographyHeadingGuide from './showcasedComponents/TypographyHeadingGuide';
import { colors } from 'constants/styles';

import './StylesGuideSyles.scss';

interface IComponent {
  label: string;
  path: string;
  component: React.FC;
}

const uiComponentsList: Array<{
  label?: string;
  components: Array<IComponent>;
}> = [
  {
    components: [
      {
        label: 'About',
        path: '',
        component: About,
      },
    ],
  },
  {
    label: 'Tokens',
    components: [
      {
        label: 'Colors',
        path: 'colors',
        component: ColorsGuide,
      },
      {
        label: 'Typography - Heading',
        path: 'typography-heading',
        component: TypographyHeadingGuide,
      },
      {
        label: 'Typography - Body',
        path: 'typography-body',
        component: TypographyBodyGuide,
      },
      {
        label: 'Box shadows',
        path: 'shadows',
        component: ShadowsGuide,
      },
      {
        label: 'Illustrations',
        path: 'illustrations',
        component: IllustrationsGuide,
      },
      {
        label: 'Spaces',
        path: 'space',
        component: SpacesGuide,
      },
    ],
  },
  {
    label: 'Global elements',
    components: [
      {
        label: 'Card',
        path: 'card',
        component: CardGuide,
      },
      {
        label: 'Autosave Indicator',
        path: 'autosave-indicator',
        component: AutosaveIndicatorGuide,
      },
      {
        label: 'App messages',
        path: 'app-messages',
        component: AppMessagesGuide,
      },
      {
        label: 'App modal',
        path: 'app-modal',
        component: AppModalGuide,
      },
      {
        label: 'Pagination',
        path: 'pagination',
        component: PaginationGuide,
      },
      {
        label: 'Expansion panel',
        path: 'expansion-panel',
        component: ExpansionPanelGuide,
      },
      {
        label: 'Loader',
        path: 'loader',
        component: LoaderGuide,
      },
      {
        label: 'ProgressBar',
        path: 'progress-bar',
        component: ProgressBarGuide,
      },
      {
        label: 'Icon',
        path: 'icon',
        component: IconGuide,
      },
      {
        label: 'Logo',
        path: 'logo',
        component: LogoGuide,
      },
      {
        label: 'DataTable',
        path: 'datatable',
        component: DataTableGuide,
      },
      {
        label: 'Pill',
        path: 'pill',
        component: PillGuide,
      },
      {
        label: 'Page title',
        path: 'page-title',
        component: PageTitleGuide,
      },
      {
        label: 'Page loader',
        path: 'page-loader',
        component: PageLoaderGuide,
      },
      {
        label: 'Page error',
        path: 'page-error',
        component: PageErrorGuide,
      },
    ],
  },
  {
    label: 'Form elements',
    components: [
      {
        label: 'Button',
        path: 'button',
        component: ButtonGuide,
      },
      {
        label: 'Input',
        path: 'input',
        component: InputGuide,
      },
      {
        label: 'Checkbox',
        path: 'checkbox',
        component: CheckboxGuide,
      },
      {
        label: 'Radio',
        path: 'radio',
        component: RadioGuide,
      },
      {
        label: 'Select',
        path: 'select',
        component: SelectGuide,
      },
      {
        label: 'Input Group',
        path: 'input-group-guide',
        component: InputGroupGuide,
      },
    ],
  },
];

const flattenedComponentsList: Array<IComponent> = uiComponentsList.reduce(
  (memo, componentGroup) => [...memo, ...componentGroup.components],
  [] as Array<IComponent>,
);

const StylesGuide: React.FC<RouteComponentProps> = (
  props: RouteComponentProps,
) => {
  const [isMenuDisplayed, toggleMenu] = useState(false);

  return (
    <div id="_routes_stylesGuide">
      <PageTitle title="Styles Guide" />

      <main>
        <CardComponent htmlTag="menu">
          <header onClick={() => toggleMenu(!isMenuDisplayed)}>
            <span>Menu</span>
            <button>
              <IconComponent
                icon={isMenuDisplayed ? mdiChevronUp : mdiChevronDown}
              />
            </button>
          </header>

          <div className={isMenuDisplayed ? 'forceDisplayed' : undefined}>
            {uiComponentsList.map((componentsGroup, index) => (
              <React.Fragment key={index}>
                {componentsGroup.label && <h3>{componentsGroup.label}</h3>}

                {componentsGroup.components.map((component) => (
                  <Link
                    className={
                      props.location.pathname ===
                      `/styles-guide/${component.path}`
                        ? 'active'
                        : undefined
                    }
                    key={`${componentsGroup.label}-${component.label}`}
                    to={`/styles-guide/${component.path}`}
                    onClick={() => toggleMenu(false)}
                    style={{
                      color: colors.main,
                    }}
                  >
                    {component.label}
                  </Link>
                ))}
              </React.Fragment>
            ))}
          </div>
        </CardComponent>

        <Switch>
          {flattenedComponentsList.map((component) => (
            <Route
              exact
              path={`/styles-guide/${component.path}`}
              key={component.path}
              component={component.component}
            />
          ))}
        </Switch>
      </main>
    </div>
  );
};

export default withRouter(StylesGuide);
