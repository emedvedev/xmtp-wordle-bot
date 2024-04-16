import cron from 'node-cron';
import storage, { forEach } from 'node-persist';

export default async function scheduleResults(client: any) {

    cron.schedule('0 0 * * *', async () => {
        // Reset all solved states (2) to subscribed states (1)
        storage.forEach(async function (el) {
            if (el.value === 2) {
                storage.setItem(el.value, 1);
            }
        })
    })

    cron.schedule('* * * * *', async () => {
        if (process.env.DEBUG === "true") console.log(`Polling for results`)

        const date = new Date((new Date).getTime() - ((new Date).getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0]

        const conversations = await client.conversations.list();
        for await (const conversation of conversations) {
            const clientSubscribed = await storage.getItem(conversation.peerAddress);

            if (clientSubscribed === 1 && conversation.peerAddress == '0xc561D7B2386A170451f04592158F18daD6d76eEf') {

                fetch(`https://openframedl.vercel.app/api/games/status?uid=${conversation.peerAddress}&ip=xmtp&date=${date}`)
                    .then(async (response) => {
                        const results = await response.json();
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
                        conversation.send(`Framedl ${date} ${results['guesses'].length}/6\n\n${resultString}\n\nhttps://openframedl.vercel.app/?id=${results['id']}`);
                        console.log(`Solved by ${conversation.peerAddress}`);
                        // await storage.setItem(conversation.peerAddress, 2);
                    })

            }
            else if (process.env.DEBUG === "true" && clientSubscribed === 0) console.log(`Skipping ${conversation.peerAddress}: unsubscribed`);
        }
    });

}
