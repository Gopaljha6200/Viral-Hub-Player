export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed"
      });
    }

    const update = req.body;

    if (update?.message?.video) {
      const video = update.message.video;
      const fileId = video.file_id;
      const chatId = update.message.chat.id;

      const baseUrl = process.env.VERCEL_DOMAIN;

      if (!baseUrl) {
        throw new Error("VERCEL_DOMAIN is not configured");
      }

      const queueResponse = await fetch(
        `${baseUrl}/api/queue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            file_id: fileId
          })
        }
      );

      const queueResult = await queueResponse.json();

      await fetch(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: queueResult.ok
              ? `Video queue me add ho gaya!\n\nQueue: ${queueResult.queue_length}`
              : `Video queue me add nahi ho paya.\n\n${queueResult.error || ""}`
          })
        }
      );
    }

    return res.status(200).json({
      ok: true
    });

  } catch (error) {
    console.error("BOT ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
