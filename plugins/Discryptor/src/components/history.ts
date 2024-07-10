import { HTTP_REGEX_MULTI } from "@vendetta/constants";
import { findByProps } from "@vendetta/metro";
import { ReactNative as RN } from "@vendetta/metro/common";
import { before } from "@vendetta/patcher";
const DCDChatManager = RN.NativeModules.DCDChatManager;
import CryptoJS from "crypto-js";
import { storage } from "@vendetta/plugin";

export function decryptContent(encryptedContent: string): string {
    const key = "default-encryption-key";
    try {
        const bytes = CryptoJS.Blowfish.decrypt(encryptedContent, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        return "Failed to decrypt message";
    }
}

type Content = {
  type?: "link";
  content: Content[] | string;
  target?: string;
};

const handleContent = (content: Content[]) => {
  for (const thing of content) {
    if (thing.type === "link" && thing.target)
      thing.target = decryptContent(thing.target);

    if (typeof thing.content === "string" && thing.content.includes('U2FsdGVkX1')) thing.content = decryptContent(thing.content);
    else {
        thing.content += " EJIDFHSDIf(❌)";
    }
  }
  console.log(content);
  return content;
};

export default function () {
  const patches = new Array<() => void>();

  patches.push(
    before("updateRows", DCDChatManager, (args) => {
      const rows = JSON.parse(args[1]);
      console.log(rows);
      for (const row of rows) {
        // Check if row.message is not undefined before accessing row.message.content
        if (row.message) {
          row.message.content = handleContent(row.message.content);
        }
      }

      args[1] = JSON.stringify(rows);
    }),
  );

  return () => patches.forEach((x) => x());
}