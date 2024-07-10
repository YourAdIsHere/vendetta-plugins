import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import CryptoJS from "crypto-js";
//syntax pain
import settings from './Settings.tsx';

const unpatch: () => boolean = () => false;

function getEncryptionKey(): string {
    return settings.encryptionKey || "default-encryption-key"; // Retrieve the encryption key from settings
}

function encryptContent(content: string): string {
    const key = getEncryptionKey();
    return CryptoJS.Blowfish.encrypt(content, key).toString();
}

function decryptContent(encryptedContent: string): string {
    const key = getEncryptionKey();
    try {
        const bytes = CryptoJS.Blowfish.decrypt(encryptedContent, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        return "Failed to decrypt message";
    }
}

function isEncrypted(content: string): boolean {
    // Simple check to determine if the message is encrypted
    // This could be enhanced based on specific requirements or message structure
    return content.startsWith("U2FsdGVkX1"); // This is a prefix used by Blowfish encryption in CryptoJS
}

function isChannelEncrypted(channelId: string): boolean {
    return settings.encryptedChannels.includes(channelId);
}

export default {
    onLoad() {
        console.log("Plugin is loading...");

        const MessageActions = findByProps('sendMessage', 'editMessage');
        const MessageStore = findByProps('getMessages');
        const ChannelStore = findByProps('getChannel');

        console.log("MessageActions: ", MessageActions);
        console.log("MessageStore: ", MessageStore);
        console.log("ChannelStore: ", ChannelStore);

        if (!MessageActions || !MessageStore || !ChannelStore) {
            console.error("Failed to find required props.");
            return;
        }

        unpatch?.();

        before('sendMessage', MessageActions, args => {
            console.log("sendMessage patched");
            const [channelId, { content }] = args;
            if (!content) return;

            if (isChannelEncrypted(channelId)) {
                try {
                    args[1].content = encryptContent(content);
                } catch (error) {
                    args[1].content = '';
                    return showToast('Failed to encrypt message', getAssetIDByName('Small'));
                }
            }
        });

        before('receiveMessage', MessageStore, args => {
            console.log("receiveMessage patched");
            const message = args[0];
            if (!message || !message.content) return;

            const channelId = message.channel_id || message.channel?.id;

            if (isChannelEncrypted(channelId)) {
                try {
                    if (isEncrypted(message.content)) {
                        message.content = decryptContent(message.content);
                    }
                } catch (error) {
                    message.content = 'Failed to decrypt message';
                }
            }
        });

        console.log("Plugin loaded successfully.");
    },
    onUnload: () => {
        unpatch();
        console.log("Plugin unloaded.");
    },
    settings,
};
