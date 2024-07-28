import { ConfigValue } from "@monkeytype/shared-types/config";

type SetFunction<T> = (
  param: T,
  nosave?: boolean,
  tribeOverride?: boolean
) => boolean;

type ValueAndSetFunction<T> = {
  value: T;
  setFunction: SetFunction<T>;
};

type SettingsMemory<T> = Record<string, ValueAndSetFunction<T>>;

let settingsMemory: SettingsMemory<ConfigValue> = {};

export function save<T extends ConfigValue>(
  settingName: string,
  value: T,
  setFunction: SetFunction<T>
): void {
  settingsMemory[settingName] ??= {
    value,
    setFunction: setFunction as SetFunction<ConfigValue>,
  };
}

export function load(tribeOverride = false): void {
  Object.keys(settingsMemory).forEach((setting) => {
    const memory = settingsMemory[setting] as ValueAndSetFunction<ConfigValue>;
    memory.setFunction(memory.value, true, tribeOverride);
  });
  settingsMemory = {};
}
