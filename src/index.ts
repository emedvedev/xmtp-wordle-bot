import "dotenv/config";
import HandlerContext from "./handler-context.js";
import run from "./runner.js";
import storage from 'node-persist';

storage.init();

run(async (context: HandlerContext) => {
  const messageBody = context.message.content;
  const sender = context.message.senderAddress;
  const isKnownSender = (await storage.getItem(sender)) === 1;

  if (!isKnownSender && messageBody) {
    await context.reply(`Hi there! I'm a daily Wordle bot, and I will now be sending you a Wordle puzzle every day!`);
    await new Promise(resolve => setTimeout(resolve, 200));
    await context.reply(`It works through OpenFrames, and you can play it right in your chat window, but make sure you have an XMTP client that supports Frames, like Converse (https://getconverse.app/)`);
    await new Promise(resolve => setTimeout(resolve, 200));
    await context.reply(`The Wordle frame is OpenFramedl made by ds8`);
    await new Promise(resolve => setTimeout(resolve, 200));
    await context.reply(`To unsubscribe from my daily Wordles, send STOP`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await context.reply(`And now, for your first Wordle:`);
    await new Promise(resolve => setTimeout(resolve, 200));
    await context.reply(`https://openframedl.vercel.app/`);
    storage.setItem(sender, 1);
  } else if (messageBody.toLowerCase() === 'stop') {
    await context.reply(`No problem! I will now stop sending you the daily Wordles. To subscribe again, just send me a message with any text.`);
    storage.setItem(sender, 0);
  }

});
