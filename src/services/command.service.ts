/**
 * Command Service
 */
import { clearHistory, getHistory } from "./memory.service.js";
import { rememberOutgoingReply } from "./outgoingReplyTracker.js";
import { tryCreateMeetingFromText } from "./meetingScheduler.service.js";

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
  const normalizedText = text.trim();
  const lowerText = normalizedText.toLowerCase();

  if (normalizedText == "/") {
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

  if (lowerText == "/time") {
    const date = new Date();
    rememberOutgoingReply(message.from, `The current time is ${date.getHours()}:${date.getMinutes()}`);
    await message.reply(`The current time is ${date.getHours()}:${date.getMinutes()}`);
  }

  if (lowerText.startsWith("/schedule")) {
    const result = await tryCreateMeetingFromText(message.from, normalizedText);

    if (result) {
      rememberOutgoingReply(message.from, result.reply);
      await message.reply(result.reply);
      return;
    }

    const promptReply =
      "Send me a meeting time like `/schedule meeting at 8pm` and I will create the Google Meet link.";
    rememberOutgoingReply(message.from, promptReply);
    await message.reply(promptReply);
  }

  if (lowerText == "/reset") {
    const contactName = await getSafeContactName(message, "User");
    clearHistory(contactName);
    rememberOutgoingReply(message.from, "Chat history has been cleared.");
    await message.reply("Chat history has been cleared.");
  }

  if (lowerText == "/history") {
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
