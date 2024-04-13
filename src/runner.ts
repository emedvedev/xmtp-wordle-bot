import createClient from "./client.js";
import HandlerContext from "./handler-context.js";
import scheduleMessages from "./schedule-messages.js";

type Handler = (message: HandlerContext) => Promise<void>;

export default async function run(handler: Handler) {
  const client = await createClient();
  console.log(`Listening on ${client.address}`);
  scheduleMessages(client);

  for await (const message of await client.conversations.streamAllMessages(
    () => {
      console.log("Connection lost");
    }
  )) {
    if (process.env.DEBUG === "true" && message.senderAddress != client.address) console.log(`Got a message from ${message.senderAddress}: ${message.content}`);

    try {
      if (message.senderAddress == client.address) {
        continue;
      }

      const context = new HandlerContext(message);

      await handler(context);
    } catch (e) {
      console.log(`error`, e, message);
    }
  }
}
