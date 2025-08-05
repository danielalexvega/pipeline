import { FC } from 'react';
// @ts-expect-error: No type definitions for 'react-hubspot-form'
import HubspotForm from 'react-hubspot-form';
import { createElementSmartLink, createItemSmartLink } from '../utils/smartlink';
import { FormHubspotIntegration } from '../model';

type Props = Readonly<{
  item: FormHubspotIntegration;
}>;

export const HubSpotFormComponent: FC<Props> = (props) => {
  return (
    <div
      {...createItemSmartLink(props.item.system.id, props.item.system.name)}
      {...createElementSmartLink("form__hubspot_integration")}
      className={`bg-white shadow-md rounded px-8 pt-6 pb-8 my-16`}
        >
      {props.item.elements.form.value && (
        <HubspotForm
          portalId={import.meta.env.VITE_HUBSPOT_PORTAL_ID}
          formId={(() => {
            try {
              return JSON.parse(props.item.elements.form.value).formId;
            } catch (e) {
              console.error('Invalid JSON in form value:', e);
              return '';
            }
          })()}
          onSubmit={() => console.log('Submit!')}
          onReady={() => console.log('Form ready!')}
          loading={<div>Loading...</div>}
        />
      )}
    </div>
  );
};
HubSpotFormComponent.displayName = 'HubSpotFormComponent';
