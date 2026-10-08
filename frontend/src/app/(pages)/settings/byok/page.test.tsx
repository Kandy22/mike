import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateApiKey } = vi.hoisted(() => ({
    updateApiKey: vi.fn(async () => true),
}));

vi.mock("@/app/components/popups/MfaVerificationPopup", () => ({
    MfaVerificationPopup: () => null,
    needsMfaVerification: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/app/components/settings/RouterSettingsSection", () => ({
    RouterSettingsSection: () => null,
}));

const notConfigured = { configured: false, source: null };

vi.mock("@/app/contexts/UserProfileContext", () => ({
    useUserProfile: () => ({
        profile: {
            apiKeys: {
                claude: notConfigured,
                gemini: notConfigured,
                openai: notConfigured,
                mistral: notConfigured,
                openrouter: notConfigured,
                vercel: notConfigured,
                "opencode-go": notConfigured,
                bedrock: notConfigured,
                azure: { configured: true, source: "user" },
                courtlistener: notConfigured,
            },
            apiKeySettings: { azure: { endpoint: "contoso-openai" } },
        },
        updateApiKey,
    }),
}));

import ByokPage from "./page";

describe("BYOK page cloud-platform keys", () => {
    beforeEach(() => {
        updateApiKey.mockClear();
    });

    it("saves a Bedrock key with its region", async () => {
        const user = userEvent.setup();
        render(<ByokPage />);

        await user.type(
            screen.getByLabelText("Amazon Bedrock API Key"),
            "bedrock-key",
        );
        await user.type(screen.getByLabelText("AWS region"), "us-east-1");
        const bedrockSave = screen.getAllByRole("button", { name: "Save" }).find(
            (button) => !button.hasAttribute("disabled"),
        )!;
        await user.click(bedrockSave);

        expect(updateApiKey).toHaveBeenCalledWith("bedrock", "bedrock-key", {
            region: "us-east-1",
        });
    });

    it("shows the saved Azure endpoint and changes it without a new key", async () => {
        const user = userEvent.setup();
        render(<ByokPage />);
        const endpoint = screen.getByLabelText(
            "Azure OpenAI resource name or endpoint",
        );
        expect(endpoint).toHaveValue("contoso-openai");

        await user.clear(endpoint);
        await user.type(endpoint, "https://contoso.openai.azure.com");
        const azureSave = screen.getAllByRole("button", { name: "Save" }).find(
            (button) => !button.hasAttribute("disabled"),
        )!;
        await user.click(azureSave);

        expect(updateApiKey).toHaveBeenCalledWith("azure", null, {
            endpoint: "https://contoso.openai.azure.com",
        });
    });
});
