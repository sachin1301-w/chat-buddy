/**
 * Bot
 */
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { handleMessages } from "./services/messageHandler.service.js";
import { getBanner } from "./utils/banner.js";
import { getStorageDir } from "./storage/configStore.js";

type ClientType = import("whatsapp-web.js").Client;

const { Client, LocalAuth } = pkg;

export class WhatsAppBot {
  private client: ClientType;
  private username: string;
  private agentName: string;
  private processedMessageIds = new Map<string, number>();

  constructor(username: string = "User", agentName: string = "Assistant") {
    this.username = username;
    this.agentName = agentName;

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: getStorageDir() }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        timeout: 60000,
      },
    });

    this.initializeEvents();
  }

  private initializeEvents() {
    const shouldProcessMessage = (message: any): boolean => {
      const messageId = message?.id?._serialized;
      if (!messageId) return true;

      const now = Date.now();
      for (const [id, timestamp] of this.processedMessageIds.entries()) {
        if (now - timestamp > 5 * 60 * 1000) {
          this.processedMessageIds.delete(id);
        }
      }

      const existing = this.processedMessageIds.get(messageId);
      if (existing && now - existing < 30 * 1000) {
        return false;
      }

      this.processedMessageIds.set(messageId, now);
      return true;
    };

    this.client.on("qr", (qr) => {
      console.log("Scan QR to login:");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("loading_screen", (percent, message) => {
      console.log(`WhatsApp loading: ${percent}% - ${message}`);
    });

    this.client.on("authenticated", () => {
      console.log("WhatsApp authenticated. Finishing startup...");
    });

    this.client.on("ready", async () => {
      try {
        console.clear();
        void getBanner(this.agentName, this.username);
      } catch (err) {
        console.log(err);
      }
    });

    this.client.on("auth_failure", (msg) => {
      console.log("Auth failed:", msg);
    });

    this.client.on("disconnected", (reason) => {
      console.log("Disconnected:", reason);
      console.log("Reconnecting...");
      this.client.initialize();
    });

    const onMessage = async (message: any) => {
      if (!shouldProcessMessage(message)) return;

      try {
        await handleMessages(message, this.username, this.agentName);
      } catch (err) {
        console.log("Message error:", err);
      }
    };

    this.client.on("message", onMessage);
    this.client.on("message_create", onMessage);
  }

  public start() {
    console.log("Launching WhatsApp browser session... this can take up to a minute on first run.");
    this.client.initialize().catch((err) => {
      console.log(err);
    });
  }
}

export const botRebootTime = Date.now();
