"use client";

import { useEffect, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  MfaVerificationPopup,
  needsMfaVerification,
} from "@/app/components/popups/MfaVerificationPopup";
import { WarningPopup } from "@/app/components/popups/WarningPopup";
import { SettingsTextInput } from "@/app/components/settings/SettingsTextInput";
import { SettingsRow } from "./SettingsRow";
import { SettingsDescription, SettingsLabel } from "./SettingsText";
import { isMfaRequiredError } from "@/app/lib/mikeApi";
import { settingsGlassIconButtonClassName } from "@/app/(pages)/settings/settingsStyles";

// The backend never returns saved keys, so the mask is a fixed-length stand-in.
const SAVED_KEY_MASK = "x".repeat(24);

/**
 * A non-secret value a key is only usable with (an AWS region, an Azure
 * resource). It is saved together with a new key, and can be changed on its
 * own once a key is saved.
 */
export type ApiKeyFieldSetting = {
  label: string;
  placeholder: string;
  /** The value saved with the user's own key, or null when there is none. */
  savedValue: string | null;
  /** Canonical form of a typed value, or null when it is not valid. */
  normalize: (value: string) => string | null;
  invalidMessage: string;
};

export function ApiKeyField({
  label,
  description,
  placeholder,
  hasSavedKey,
  setting,
  onSave,
  onRemove,
}: {
  label: string;
  description?: string;
  placeholder: string;
  hasSavedKey: boolean;
  setting?: ApiKeyFieldSetting;
  /** Called with the typed key ("" when only the setting changed) and,
   *  for fields with a setting, its normalized value. */
  onSave: (value: string, settingValue?: string) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}) {
  const settingInputId = useId();
  const settingErrorId = useId();
  const savedSettingValue = setting?.savedValue ?? "";
  const [value, setValue] = useState("");
  const [settingValue, setSettingValue] = useState(savedSettingValue);
  const [settingError, setSettingError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [pendingMfaAction, setPendingMfaAction] = useState<
    "save" | "remove" | null
  >(null);

  useEffect(() => {
    setValue("");
  }, [hasSavedKey]);

  useEffect(() => {
    setSettingValue(savedSettingValue);
    setSettingError(null);
  }, [savedSettingValue]);

  const keyDirty = value.trim().length > 0;
  const settingDirty =
    !!setting && settingValue.trim() !== savedSettingValue;
  // A setting alone can only be saved onto a key that already exists.
  const dirty = keyDirty || (hasSavedKey && settingDirty);
  const showMask = hasSavedKey && !isEditing && !keyDirty;

  const handleSave = async () => {
    let normalizedSetting: string | undefined;
    if (setting) {
      const normalized = setting.normalize(settingValue);
      if (!normalized) {
        setSettingError(setting.invalidMessage);
        return;
      }
      normalizedSetting = normalized;
    }
    setSettingError(null);
    setIsSaving(true);
    try {
      if (await needsMfaVerification()) {
        setPendingMfaAction("save");
        return;
      }
      const ok = setting
        ? await onSave(value, normalizedSetting)
        : await onSave(value);
      if (ok) {
        setValue("");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setWarningMessage(`Failed to save ${label}. Please try again.`);
      }
    } catch (error) {
      if (isMfaRequiredError(error)) {
        setPendingMfaAction("save");
      } else {
        setWarningMessage(`Failed to save ${label}. Please try again.`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      if (await needsMfaVerification()) {
        setPendingMfaAction("remove");
        return;
      }
      const ok = await onRemove();
      if (!ok) {
        setWarningMessage(`Failed to remove ${label}. Please try again.`);
      }
    } catch (error) {
      if (isMfaRequiredError(error)) {
        setPendingMfaAction("remove");
      } else {
        setWarningMessage(`Failed to remove ${label}. Please try again.`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleMfaVerified = async () => {
    const action = pendingMfaAction;
    setPendingMfaAction(null);
    if (action === "save") {
      await handleSave();
    } else if (action === "remove") {
      await handleRemove();
    }
  };

  return (
    <>
      <SettingsRow layout="stacked">
        <div className={description ? "space-y-1" : undefined}>
          <SettingsLabel>{label}</SettingsLabel>
          {description && (
            <SettingsDescription>{description}</SettingsDescription>
          )}
        </div>
        <div className="space-y-2">
          <div className="relative flex-1">
            <SettingsTextInput
              aria-label={label}
              type={reveal && !showMask ? "text" : "password"}
              value={showMask ? SAVED_KEY_MASK : value}
              readOnly={showMask}
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
              onChange={(event) => setValue(event.target.value)}
              placeholder={hasSavedKey ? "Enter a new key to replace" : placeholder}
              className="pr-10"
              autoComplete="off"
              spellCheck={false}
            />
            {keyDirty && (
              <button
                type="button"
                onClick={() => setReveal((current) => !current)}
                className={`absolute inset-y-1 right-1.5 flex items-center ${settingsGlassIconButtonClassName}`}
                aria-label={reveal ? "Hide key" : "Show key"}
              >
                {reveal ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          {setting && (
            <div className="space-y-1">
              <label
                htmlFor={settingInputId}
                className="block text-sm text-gray-500"
              >
                {setting.label}
              </label>
              <SettingsTextInput
                id={settingInputId}
                type="text"
                value={settingValue}
                onChange={(event) => {
                  setSettingValue(event.target.value);
                  setSettingError(null);
                }}
                placeholder={setting.placeholder}
                aria-invalid={settingError ? true : undefined}
                aria-describedby={settingError ? settingErrorId : undefined}
                autoComplete="off"
                spellCheck={false}
              />
              {settingError && (
                <p id={settingErrorId} className="text-xs text-red-600">
                  {settingError}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !dirty || saved}
              className="text-xs font-medium text-gray-700 transition-colors hover:text-gray-950 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {isSaving ? "Saving..." : saved ? "Saved" : "Save"}
            </button>
            {hasSavedKey && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isSaving}
                className="text-xs font-medium text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:text-red-300"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </SettingsRow>
      <MfaVerificationPopup
        open={!!pendingMfaAction}
        onCancel={() => setPendingMfaAction(null)}
        onVerified={() => void handleMfaVerified()}
      />
      <WarningPopup
        open={!!warningMessage}
        title="API key update failed"
        message={warningMessage}
        onClose={() => setWarningMessage(null)}
      />
    </>
  );
}
