import { findByProps } from "@vendetta/metro";
import { ReactNative } from "@vendetta/metro/common";
import CryptoJS from "crypto-js";
import Settings from "./Settings";
import { storage } from "@vendetta/plugin";
import { getAssetIDByName as getAssetId } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { before } from "@vendetta/patcher";

// Define a placeholder for unpatching the methods
const unpatch: () => boolean = () => false;
const DCDChatManager = ReactNative.NativeModules.DCDChatManager;

// Retrieve the encryption key from settings
function getEncryptionKey(): string {
    return storage.encryptionKey || "default-encryption-key";
}

// Encrypt the message content
function encryptContent(content: string): string {
    const key = getEncryptionKey();
    return CryptoJS.Blowfish.encrypt(content, key).toString();
}

// Decrypt the message content
function decryptContent(encryptedContent: string): string {
    const key = getEncryptionKey();
    try {
        const bytes = CryptoJS.Blowfish.decrypt(encryptedContent, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        return "Failed to decrypt message";
    }
}

// Check if the content is encrypted
function isEncrypted(content: string): boolean {
    return typeof content === 'string' && content.startsWith("U2FsdGVkX1");  // Simple check for Blowfish encryption
}

// Handle message content for encryption/decryption
const handleMessage = (msg: any) => {
    if (msg?.content) {
        if (typeof msg.content === 'string' && isEncrypted(msg.content)) {
            msg.content = decryptContent(msg.content);
        } else if (typeof msg.content === 'string') {
            msg.content += " (❌)";
        }
    }
};

// Process messages in the `updateRows` method
const processRows = (rows: any[]) => {
    for (const row of rows) {
        if (row.message?.content) {
            handleMessage(row.message);
        }
    }
    return rows;
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
            if (!content) return;

            try {
                args[1].content = encryptContent(content);
            } catch (error) {
                args[1].content = '';
                return showToast('Failed to encrypt message', getAssetId('Small'));
            }
        });

        // Hook into the `updateRows` method to handle past messages
        before('updateRows', DCDChatManager, args => {
            console.log("updateRows patched");
            const rows = JSON.parse(args[1]);
            const processedRows = processRows(rows);
            args[1] = JSON.stringify(processedRows);
        });

        // Hook into the `dispatch` method to handle new messages
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
}
