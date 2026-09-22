import { put, get } from "@vercel/blob";

const QUEUE_FILE = "queue.json";

async function getQueue() {
  try {
    const result = await get(QUEUE_FILE, {
      access: "private",
      useCache: false
    });

    const text = await new Response(result.stream).text();
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function saveQueue(queue) {
  await put(
    QUEUE_FILE,
    JSON.stringify(queue),
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    }
  );
}

function checkCronSecret(req) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  return cronSecret && authHeader === `Bearer ${cronSecret}`;
}

export default async function handler(req, res) {
  try {
    if (!checkCronSecret(req)) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const channelId = process.env.CHANNEL_ID;
    const baseUrl = process.env.VERCEL_DOMAIN;

    if (!channelId || !baseUrl) {
      return res.status(500).json({
        ok: false,
        error: "CHANNEL_ID or VERCEL_DOMAIN is not configured"
      });
    }

    const queue = await getQueue();

    if (queue.length === 0) {
      return res.status(200).json({
        ok: true,
        message: "Queue is empty"
      });
    }

    const video = queue[0];

    const playerUrl =
      `${baseUrl}/api/player?file_id=${encodeURIComponent(video.file_id)}`;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendVideo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: channelId,
          video: video.file_id,
          caption: "Viral Hub",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "▶ Play Now",
                  url: playerUrl
                }
              ]
            ]
          }
        })
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      return res.status(500).json({
        ok: false,
        telegram_error: telegramResult.description
      });
    }

    queue.shift();
    await saveQueue(queue);

    return res.status(200).json({
      ok: true,
      message: "Video posted successfully",
      remaining: queue.length
    });

  } catch (error) {
    console.error("POST ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
