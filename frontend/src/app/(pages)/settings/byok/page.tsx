"use client";

import {
  ApiKeyField,
  type ApiKeyFieldSetting,
} from "@/app/components/settings/ApiKeyField";
import { RouterSettingsSection } from "@/app/components/settings/RouterSettingsSection";
import { GlassCardUI } from "@/shared/ui/GlassCardUI";
import { SettingsHeading } from "@/app/components/settings/SettingsHeading";
import { SettingsDescription } from "@/app/components/settings/SettingsText";
import { useUserProfile } from "@/app/contexts/UserProfileContext";
import {
  normalizeAwsRegion,
  normalizeAzureEndpoint,
} from "@/app/lib/cloudProviderSettings";
import type { ApiKeySettings } from "@/app/lib/mikeApi";

const MODEL_API_KEY_FIELDS = [
  {
    provider: "claude",
    label: "Anthropic (Claude) API Key",
    placeholder: "sk-ant-...",
  },
  {
    provider: "gemini",
    label: "Google (Gemini) API Key",
    placeholder: "AI...",
  },
  {
    provider: "openai",
    label: "OpenAI API Key",
    placeholder: "sk-...",
  },
  {
    provider: "mistral",
    label: "Mistral AI API Key",
    placeholder: "Enter your Mistral API key",
  },
  {
    provider: "bedrock",
    label: "Amazon Bedrock API Key",
    placeholder: "Enter your Amazon Bedrock API key",
  },
  {
    provider: "azure",
    label: "Azure OpenAI API Key",
    placeholder: "Enter your Azure OpenAI API key",
  },
  {
    provider: "openrouter",
    label: "OpenRouter API Key",
    placeholder: "sk-or-...",
  },
  {
    provider: "vercel",
    label: "Vercel AI Gateway API Key",
    placeholder: "vck_...",
  },
  {
    provider: "opencode-go",
    label: "OpenCode Go API Key",
    placeholder: "sk-...",
  },
] as const;

type SettingsProvider = keyof ApiKeySettings;

/** The setting each cloud-platform key is saved with. */
function keySetting(
  provider: SettingsProvider,
  settings: ApiKeySettings | undefined,
): ApiKeyFieldSetting {
  if (provider === "bedrock") {
    return {
      label: "AWS region",
      placeholder: "us-east-1",
      savedValue: settings?.bedrock?.region ?? null,
      normalize: normalizeAwsRegion,
      invalidMessage:
        "Enter the AWS region the key was created in, for example us-east-1.",
    };
  }
  return {
    label: "Azure OpenAI resource name or endpoint",
    placeholder: "contoso-openai or https://contoso-openai.openai.azure.com",
    savedValue: settings?.azure?.endpoint ?? null,
    normalize: normalizeAzureEndpoint,
    invalidMessage:
      "Enter a resource name, or an https endpoint on openai.azure.com, cognitiveservices.azure.com or services.ai.azure.com.",
  };
}

function settingsFor(
  provider: SettingsProvider,
  value: string,
): NonNullable<ApiKeySettings[SettingsProvider]> {
  return provider === "bedrock" ? { region: value } : { endpoint: value };
}

export default function ByokPage() {
  const { profile, updateApiKey } = useUserProfile();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SettingsHeading>API Keys</SettingsHeading>
        <SettingsDescription>
          A personal API key saved here means all future requests for the
          relevant provider will automatically be routed through your API key
          and charged to your own API platform account.
        </SettingsDescription>
        <GlassCardUI>
          {MODEL_API_KEY_FIELDS.map((field) => {
            const settingsProvider =
              field.provider === "bedrock" || field.provider === "azure"
                ? field.provider
                : null;
            return (
              <div key={field.provider}>
                <ApiKeyField
                  label={field.label}
                  placeholder={field.placeholder}
                  hasSavedKey={
                    profile?.apiKeys[field.provider].source === "user"
                  }
                  setting={
                    settingsProvider
                      ? keySetting(settingsProvider, profile?.apiKeySettings)
                      : undefined
                  }
                  onSave={(value, settingValue) =>
                    updateApiKey(
                      field.provider,
                      value.trim() || null,
                      settingsProvider && settingValue
                        ? settingsFor(settingsProvider, settingValue)
                        : undefined,
                    )
                  }
                  onRemove={() => updateApiKey(field.provider, null)}
                />
              </div>
            );
          })}
        </GlassCardUI>
      </section>

      <RouterSettingsSection />
    </div>
  );
}
