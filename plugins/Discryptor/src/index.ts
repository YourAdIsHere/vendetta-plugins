import { findByProps } from "@vendetta/metro";
import { ReactNative } from "@vendetta/metro/common";
import CryptoJS from "crypto-js";
import Settings from "./Settings";
import * as importAll from "./components/history";
import { storage } from "@vendetta/plugin";
import { getAssetIDByName as getAssetId } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { before, after } from "@vendetta/patcher";
import { findByName, findByStoreName } from "@vendetta/metro";
import { Embed, Message } from "vendetta-extras";

// Define a placeholder for unpatching the methods
let unpatchSendMessage: () => void;
let unpatchDispatch: () => void;
const DCDChatManager = ReactNative.NativeModules.DCDChatManager;

const patches = [];
const RowManager = findByName("RowManager");
const blowfishString = "U2FsdGVkX1"

patches.push(before("generate", RowManager.prototype, ([data]) => {
  //if (data.rowType !== 1) return;

  let content = data.message.content as string;
  if (!content?.length) return;
  const matchIndex = content.match(blowfishString).index;
  if (matchIndex === undefined) content += " (❌)";
  if (matchIndex !== undefined) content = decryptContent(content);

  data.message.content = content;
}));

patches.push(after("generate", RowManager.prototype, ([data], row) => {
  if (data.rowType !== 1) return;
  const { content } = row.message as Message;
  if (!Array.isArray(content)) return;

}));

export const onUnload = () => patches.forEach((unpatch) => unpatch());

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
export function decryptContent(encryptedContent: string): string {
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
        if (unpatchDispatch) unpatchDispatch();
        console.log("Plugin unloaded.");
    },

    settings: Settings
}
