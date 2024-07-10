import { findByName, findByStoreName } from "@vendetta/metro";
import { after, before } from "@vendetta/patcher";
import { Embed, Message } from "vendetta-extras";
import { decryptContent } from "../index";

const patches = [];
const RowManager = findByName("RowManager");
const blowfishString = "U2FsdGVkX1"

patches.push(before("generate", RowManager.prototype, ([data]) => {
  if (data.rowType !== 1) return;

  let content = data.message.content as string;
  if (!content?.length) return;
  const matchIndex = content.startsWith(blowfishString);
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