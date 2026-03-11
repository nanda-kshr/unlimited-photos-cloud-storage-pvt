
export async function GET() {
    return Response.json({ token: "", chat: process.env.CHAT_ID || "" });
}