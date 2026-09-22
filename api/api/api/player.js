export default async function handler(req, res) {
  const fileId = req.query.file_id;

  if (!fileId) {
    return res.status(400).send("Video file_id missing");
  }

  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    return res.status(500).send("BOT_TOKEN is not configured");
  }

  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`
    );

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      return res.status(500).send("Telegram file not found");
    }

    const filePath = telegramData.result.file_path;

    const videoUrl =
      `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Viral Hub Player</title>
</head>

<body style="margin:0;background:#000;color:#fff;font-family:Arial,sans-serif">

  <div style="
    padding:18px;
    text-align:center;
    font-size:24px;
    font-weight:bold;
  ">
    Viral Hub Player
  </div>

  <video
    controls
    playsinline
    preload="metadata"
    style="
      width:100%;
      max-height:75vh;
      background:#000;
    "
    src="${videoUrl}"
  ></video>

  <div style="
    text-align:center;
    padding:20px;
    color:#aaa;
  ">
    Video ready to play
  </div>

</body>
</html>
    `);

  } catch (error) {
    console.error("PLAYER ERROR:", error);
    return res.status(500).send("Player error");
  }
}
