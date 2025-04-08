
export async function GET() {
    return Response.json({ token: process.env.BOT_TOKEN });
}