/**
 * Command Service
 */
import { clearHistory, getHistory } from "./memory.service.js";
import { rememberOutgoingReply } from "./outgoingReplyTracker.js";

type MessageType = import("whatsapp-web.js").Message;

const getSafeContactName = async (message: MessageType, fallbackName: string): Promise<string> => {
  if (message.fromMe) {
    return fallbackName;
  }

  try {
    const contact = await message.getContact();
    return contact.pushname || contact.number || fallbackName;
  } catch {
    return fallbackName;
  }
};

export const handleCommand = async (message: MessageType, text: string): Promise<void> => {
  if (text == "/") {
    rememberOutgoingReply(message.from, `Welcome to bot helper dashboard : 
      - Enter /time for current time
      - Enter /schedule for setting an reminder
      - Enter /history for seeing the chat history
      - Enter /reset for reset it to null
      `);
    await message.reply(`Welcome to bot helper dashboard : 
        - Enter /time for current time
        - Enter /schedule for setting an reminder
        - Enter /history for seeing the chat history
        - Enter /reset for reset it to null
        `);
  }

  if (text == "/time") {
    const date = new Date();
    rememberOutgoingReply(message.from, `The current time is ${date.getHours()}:${date.getMinutes()}`);
    await message.reply(`The current time is ${date.getHours()}:${date.getMinutes()}`);
  }

  if (text == "/schedule") {
    rememberOutgoingReply(message.from, `Currently busy this week. Please feel free to reach out again next week.`);
    await message.reply(`Currently busy this week. Please feel free to reach out again next week.`);
  }

  if (text == "/reset") {
    const contactName = await getSafeContactName(message, "User");
    clearHistory(contactName);
    rememberOutgoingReply(message.from, "Chat history has been cleared.");
    await message.reply("Chat history has been cleared.");
  }

  if (text == "/history") {
    const contactName = await getSafeContactName(message, "User");
    const history = getHistory(contactName);
    if (history.length === 0) {
      rememberOutgoingReply(message.from, "No chat history found.");
      await message.reply("No chat history found.");
    } else {
      rememberOutgoingReply(message.from, history.join("\n"));
      await message.reply(history.join("\n"));
    }
  }
};
