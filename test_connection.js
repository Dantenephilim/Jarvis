
// Node 18+ has built-in fetch. No imports needed.
async function testConnection() {
    const url = "https://nexotechx.com/webhook/1faaf855-bd93-4b57-a298-8bdd00e419da";
    console.log(`Testing connection to: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "test_from_node_script" })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log("Response Body Preview:", text.substring(0, 500)); // Show first 500 chars

        if (text.includes("Just a moment") || text.includes("Cloudflare")) {
            console.log("\n[DIAGNOSTIC] CLOUDFLARE BLOCK DETECTED.");
        } else if (response.ok) {
            console.log("\n[DIAGNOSTIC] SUCCESS! Connection works from terminal.");
        } else {
            console.log("\n[DIAGNOSTIC] SERVER ERROR (Check n8n logs).");
        }
    } catch (error) {
        console.error("\n[DIAGNOSTIC] NETWORK ERROR:", error.message);
    }
}

testConnection();
