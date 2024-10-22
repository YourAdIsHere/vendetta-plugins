import { findByProps } from "@vendetta/metro";
import CryptoJS from "crypto-js";
import Settings from "./Settings.tsx";
import { getAssetIDByName as getAssetId } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { before } from "@vendetta/patcher";
// Define a placeholder for unpatching the methods
const unpatch = () => false;
function getEncryptionKey() {
    return Settings.encryptionKey || "default-encryption-key"; // Retrieve the encryption key from settings
}
// Encrypt the message content
function encryptContent(content) {
    const key = getEncryptionKey();
    return CryptoJS.Blowfish.encrypt(content, key).toString();
}
// Decrypt the message content
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
// Check if the content is encrypted
function isEncrypted(content) {
    // Simple check to determine if the message is encrypted
    // This could be enhanced based on specific requirements or message structure
    return content.startsWith("U2FsdGVkX1");
}
// Handle message content for encryption/decryption
const handleMessage = (msg) => {
    if (msg?.content) {
        if (msg.content && isEncrypted(msg.content)) {
            msg.content = decryptContent(msg.content);
        }
        else {
            msg.content = encryptContent(msg.content);
        }
    }
};
export default {
    onLoad() {
        console.log("Plugin is loading...");
        const MessageActions = findByProps('sendMessage', 'editMessage');
        const MessageStore = findByProps('getMessages');
        // Check for required methods
        if (!MessageActions || !MessageStore) {
            console.error("Failed to find required props.");
            return;
        }
        unpatch?.();
        // Hook into the `sendMessage` method
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
                return showToast('Failed to encrypt message', getAssetId('Small'));
            }
        });
        // Hook into the `dispatch` method to handle message content
        before('dispatch', findByProps('dispatch'), args => {
            console.log("dispatch patched");
            const [action] = args;
            if (action?.type === 'MESSAGE_CREATE') {
                const message = action.message;
                handleMessage(message);
            }
        });
        console.log("Plugin loaded successfully.");
    },
    onUnload: () => {
        unpatch();
        console.log("Plugin unloaded.");
    },
    settings: Settings
};
