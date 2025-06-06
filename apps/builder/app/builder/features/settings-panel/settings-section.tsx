import { useId } from "react";
import { useStore } from "@nanostores/react";
import type { Instance } from "@webstudio-is/sdk";
import { InputField } from "@webstudio-is/design-system";
import { $instances, $registeredComponentMetas } from "~/shared/nano-states";
import { HorizontalLayout, Label, Row, useLocalValue } from "./shared";
import { serverSyncStore } from "~/shared/sync";
import { $selectedInstance } from "~/shared/awareness";
import { getInstanceLabel } from "~/builder/shared/instance-label";

const saveLabel = (label: string, selectedInstance: Instance) => {
  serverSyncStore.createTransaction([$instances], (instances) => {
    const instance = instances.get(selectedInstance.id);
    if (instance !== undefined) {
      instance.label = label;
    }
  });
};

export const SettingsSection = () => {
  const selectedInstance = useStore($selectedInstance);
  const metas = useStore($registeredComponentMetas);
  const id = useId();
  const localValue = useLocalValue(selectedInstance?.label ?? "", (value) => {
    if (selectedInstance) {
      saveLabel(value, selectedInstance);
    }
  });

  if (selectedInstance === undefined) {
    return;
  }

  const meta = metas.get(selectedInstance.component);
  const placeholder = getInstanceLabel(selectedInstance, meta);

  return (
    <Row>
      <HorizontalLayout label={<Label htmlFor={id}>Name</Label>}>
        <InputField
          id={id}
          /* Key is required, otherwise when label is undefined, previous value stayed */
          key={selectedInstance.id}
          placeholder={placeholder}
          value={localValue.value}
          onChange={(event) => localValue.set(event.target.value.trim())}
          onBlur={localValue.save}
        />
      </HorizontalLayout>
    </Row>
  );
};
