import cron from 'node-cron';
import storage, { forEach } from 'node-persist';

export default async function scheduleResults(client: any) {

    cron.schedule('0 0 * * *', async () => {
        // Reset all solved states (2) to subscribed states (1)
        console.log('Printing daily usage and resetting solved states')
        storage.forEach(async function (el) {
            console.log(`${el.key}: ${el.value}`)
            if (el.value === 2) {
                storage.setItem(el.key, 1);
            }
        })
        console.log('Reset solved states')
    })

    cron.schedule('* * * * *', async () => {
        if (process.env.DEBUG === "true") console.log(`Polling for results`)

        const date = new Date((new Date).getTime() - ((new Date).getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0]

        const conversations = await client.conversations.list();
        for await (const conversation of conversations) {
            const clientSubscribed = await storage.getItem(conversation.peerAddress);

            if (clientSubscribed === 1) {

                fetch(
                    `https://openframedl.vercel.app/api/games/status?uid=${conversation.peerAddress}&ip=xmtp&date=${date}`,
                    { headers: { "x-framedl-api-key": `${process.env.API_KEY}` } }
                )
                    .then(async (response) => {
                        const results = await response.json();
                        if ("completedAt" in results) {
                            let resultString = results['guesses'].map((guess: any) => {
                                return guess['characters'].map((char: any) => {
                                    if (char['status'] == "WRONG_POSITION") {
                                        return "🟨"
                                    } else if (char['status'] == "CORRECT") {
                                        return "🟩"
                                    } else {
                                        return "⬜"
                                    }
                                }).join('');
                            }).join("\n");
                            conversation.send(`Thank you for playing! Share the result with friends:`);
                            await new Promise(resolve => setTimeout(resolve, 200));
                            conversation.send(`dailywordle.eth @ XMTP\n${date} ${results['guesses'].length}/6\n\n${resultString}\n\nhttps://openframedl.vercel.app/?id=${results['id']}`);
                            console.log(`Solved by ${conversation.peerAddress}`);
                            await storage.setItem(conversation.peerAddress, 2);
                        }
                    })

            }
            else if (process.env.DEBUG === "true" && clientSubscribed === 0) console.log(`Skipping ${conversation.peerAddress}: unsubscribed`);
        }
    });

}
