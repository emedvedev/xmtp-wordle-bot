import cron from 'node-cron';
import storage from 'node-persist';

export default async function scheduleMessages(client: any) {

    cron.schedule('0 0 * * *', async () => {
        console.log(`Sending the daily Wordles`);
        let counter = 0;

        const conversations = await client.conversations.list();
        for await (const conversation of conversations) {
            const clientSubscribed = await storage.getItem(conversation.peerAddress);

            if (clientSubscribed) {
                counter++;
                conversation.send(`A new daily Wordle is out! Play it now:`);
                await new Promise(resolve => setTimeout(resolve, 200));
                conversation.send(`https://openframedl.vercel.app`);
            }
            else if (process.env.DEBUG === "true" && clientSubscribed === 0) console.log(`Skipping ${conversation.peerAddress}: unsubscribed`);
        }

        console.log(`Sent ${counter} Wordles`);
    });

}
