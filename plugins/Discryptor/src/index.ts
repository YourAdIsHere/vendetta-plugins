import { findByProps } from "@vendetta/metro";
import { ReactNative } from "@vendetta/metro/common";
import CryptoJS from "crypto-js";
import Settings from "./Settings";
import { storage } from "@vendetta/plugin";
import { getAssetIDByName as getAssetId } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { before, after } from "@vendetta/patcher";

// Define a placeholder for unpatching the methods
let unpatchSendMessage: () => void;
let unpatchUpdateRows: () => void;
let unpatchDispatch: () => void;
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

type Content = {
    type?: "link";
    content: Content[] | string;
    target?: string;
};

const handleContent = (content: any) => {
        if (typeof content === "string" && isEncrypted(content)) {
            content = decryptContent(content);
        } else if (typeof content === "string") {
            content = content += " (❌)";
        }
        console.log("content=" + content);
    }
    
    return content;
};

// Process messages in the `updateRows` method
const processRows = (rows: any[]) => {
    for (const row of rows) {
        if (row.message?.content) {
       row.message.content = handleContent(row.message.content);
        console.log("row.message.content=" + row.message.content);
        console.log("row.message=" + row.message);
        }
    }
    console.log("rows=" + rows);
    return rows;
};

export default {
    onLoad() {
        console.log("Plugin is loading...");

        const MessageActions = findByProps('sendMessage', 'editMessage');
        const MessageStore = findByProps('getMessages');
        const Dispatcher = findByProps('dispatch');

        // Check for required methods
        if (!MessageActions || !MessageStore || !Dispatcher) {
            console.error("Failed to find required props.");
            return;
        }

        // Hook into the `sendMessage` method
        unpatchSendMessage = before('sendMessage', MessageActions, args => {
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
        unpatchUpdateRows = before('updateRows', DCDChatManager, args => {
            console.log("updateRows patched");
            const rows = JSON.parse(args[1]);
            const processedRows = processRows(rows);
            console.log("processedRows=" + processRows)
            args[1] = JSON.stringify(processedRows);
            console.log("FINAL=" + JSON.stringify(processedRows));
        });

        // Hook into the `dispatch` method to handle new messages
        unpatchDispatch = before('dispatch', Dispatcher, args => {
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
        if (unpatchSendMessage) unpatchSendMessage();
        if (unpatchUpdateRows) unpatchUpdateRows();
        if (unpatchDispatch) unpatchDispatch();
        console.log("Plugin unloaded.");
    },

    settings: Settings
}
