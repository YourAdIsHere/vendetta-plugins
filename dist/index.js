import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import CryptoJS from "crypto-js";
import settings from './Settings.js';
import { storage } from "@vendetta/plugin";
const unpatch = () => false;
function getEncryptionKey() {
    return storage.encryptionKey || "default-encryption-key"; // Retrieve the encryption key from settings
}
function encryptContent(content) {
    const key = getEncryptionKey();
    return CryptoJS.Blowfish.encrypt(content, key).toString();
}
function decryptContent(encryptedContent) {
    const key = getEncryptionKey();
    try {
        const bytes = CryptoJS.Blowfish.decrypt(encryptedContent, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
    catch (error) {
        return "Failed to decrypt message";
    }
}
function isEncrypted(content) {
    // Simple check to determine if the message is encrypted
    // This could be enhanced based on specific requirements or message structure
    return content.startsWith("U2FsdGVkX1"); // This is a prefix used by Blowfish encryption in CryptoJS
}
export default {
    onLoad() {
        console.log("Plugin is loading...");
        const MessageActions = findByProps('sendMessage', 'editMessage');
        const MessageStore = findByProps('getMessages');
        console.log("MessageActions: ", MessageActions);
        console.log("MessageStore: ", MessageStore);
        if (!MessageActions || !MessageStore) {
            console.error("Failed to find required props.");
            return;
        }
        unpatch?.();
        before('sendMessage', MessageActions, args => {
            console.log("sendMessage patched");
            const [channelId, { content }] = args;
            if (!content)
                return;
            try {
                args[1].content = encryptContent(content);
            }
            catch (error) {
                args[1].content = '';
                return showToast('Failed to encrypt message', getAssetIDByName('Small'));
            }
        });
        before('receiveMessage', MessageStore, args => {
            console.log("receiveMessage patched");
            const message = args[0];
            if (!message || !message.content)
                return;
            if (isEncrypted(message.content)) {
                try {
                    message.content = decryptContent(message.content);
                }
                catch (error) {
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
