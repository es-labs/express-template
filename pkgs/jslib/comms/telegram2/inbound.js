import express from "express"

const app = express();
app.use(express.json());

// ─── Extractors ───────────────────────────────────────────────────────────────

function extractMessageData(message) {
  if (!message) return null;

  return {
    // Core identifiers
    messageId: message.message_id,
    date: new Date(message.date * 1000).toISOString(),
    editedDate: message.edit_date
      ? new Date(message.edit_date * 1000).toISOString()
      : null,

    // Sender info
    from: message.from
      ? {
          id: message.from.id,
          isBot: message.from.is_bot,
          firstName: message.from.first_name,
          lastName: message.from.last_name ?? null,
          username: message.from.username ?? null,
          languageCode: message.from.language_code ?? null,
        }
      : null,

    // Chat info
    chat: message.chat
      ? {
          id: message.chat.id,
          type: message.chat.type, // private | group | supergroup | channel
          title: message.chat.title ?? null,
          username: message.chat.username ?? null,
          firstName: message.chat.first_name ?? null,
          lastName: message.chat.last_name ?? null,
        }
      : null,

    // Content
    content: extractContent(message),

    // Reply / forward context
    replyTo: message.reply_to_message
      ? extractMessageData(message.reply_to_message)
      : null,
    forwardFrom: extractForwardInfo(message),

    // Entities (mentions, commands, links, etc.)
    entities: extractEntities(message),

    // Media group (album)
    mediaGroupId: message.media_group_id ?? null,
  };
}

function extractContent(message) {
  // Text
  if (message.text) return { type: "text", text: message.text };

  // Photo (array of sizes — last is highest res)
  if (message.photo) {
    const best = message.photo.at(-1);
    return {
      type: "photo",
      fileId: best.file_id,
      fileUniqueId: best.file_unique_id,
      width: best.width,
      height: best.height,
      fileSize: best.file_size ?? null,
      caption: message.caption ?? null,
    };
  }

  // Video
  if (message.video) {
    const v = message.video;
    return {
      type: "video",
      fileId: v.file_id,
      fileUniqueId: v.file_unique_id,
      width: v.width,
      height: v.height,
      duration: v.duration,
      mimeType: v.mime_type ?? null,
      fileSize: v.file_size ?? null,
      caption: message.caption ?? null,
    };
  }

  // Audio
  if (message.audio) {
    const a = message.audio;
    return {
      type: "audio",
      fileId: a.file_id,
      fileUniqueId: a.file_unique_id,
      duration: a.duration,
      performer: a.performer ?? null,
      title: a.title ?? null,
      mimeType: a.mime_type ?? null,
      fileSize: a.file_size ?? null,
      caption: message.caption ?? null,
    };
  }

  // Voice note
  if (message.voice) {
    const v = message.voice;
    return {
      type: "voice",
      fileId: v.file_id,
      fileUniqueId: v.file_unique_id,
      duration: v.duration,
      mimeType: v.mime_type ?? null,
      fileSize: v.file_size ?? null,
    };
  }

  // Document / file
  if (message.document) {
    const d = message.document;
    return {
      type: "document",
      fileId: d.file_id,
      fileUniqueId: d.file_unique_id,
      fileName: d.file_name ?? null,
      mimeType: d.mime_type ?? null,
      fileSize: d.file_size ?? null,
      caption: message.caption ?? null,
    };
  }

  // Sticker
  if (message.sticker) {
    const s = message.sticker;
    return {
      type: "sticker",
      fileId: s.file_id,
      fileUniqueId: s.file_unique_id,
      width: s.width,
      height: s.height,
      isAnimated: s.is_animated,
      isVideo: s.is_video,
      emoji: s.emoji ?? null,
      setName: s.set_name ?? null,
    };
  }

  // Location
  if (message.location) {
    return {
      type: "location",
      latitude: message.location.latitude,
      longitude: message.location.longitude,
      horizontalAccuracy: message.location.horizontal_accuracy ?? null,
      livePeriod: message.location.live_period ?? null,
    };
  }

  // Contact
  if (message.contact) {
    const c = message.contact;
    return {
      type: "contact",
      phoneNumber: c.phone_number,
      firstName: c.first_name,
      lastName: c.last_name ?? null,
      userId: c.user_id ?? null,
    };
  }

  // Poll
  if (message.poll) {
    const p = message.poll;
    return {
      type: "poll",
      id: p.id,
      question: p.question,
      options: p.options.map((o) => ({ text: o.text, voterCount: o.voter_count })),
      totalVoterCount: p.total_voter_count,
      isClosed: p.is_closed,
      isAnonymous: p.is_anonymous,
      pollType: p.type, // regular | quiz
      correctOptionId: p.correct_option_id ?? null,
    };
  }

  // Video note (round video)
  if (message.video_note) {
    const vn = message.video_note;
    return {
      type: "video_note",
      fileId: vn.file_id,
      fileUniqueId: vn.file_unique_id,
      length: vn.length,
      duration: vn.duration,
      fileSize: vn.file_size ?? null,
    };
  }

  return { type: "unknown" };
}

function extractEntities(message) {
  const raw = message.entities ?? message.caption_entities ?? [];
  if (!raw.length) return [];

  const text = message.text ?? message.caption ?? "";

  return raw.map((e) => ({
    type: e.type, // mention | hashtag | cashtag | bot_command | url | email | bold | italic | etc.
    offset: e.offset,
    length: e.length,
    value: text.slice(e.offset, e.offset + e.length),
    url: e.url ?? null,         // for inline links
    user: e.user ?? null,       // for text_mention entities
    language: e.language ?? null, // for pre/code blocks
  }));
}

function extractForwardInfo(message) {
  if (!message.forward_date) return null;
  return {
    date: new Date(message.forward_date * 1000).toISOString(),
    fromUser: message.forward_from ?? null,
    fromChat: message.forward_from_chat ?? null,
    fromMessageId: message.forward_from_message_id ?? null,
    senderName: message.forward_sender_name ?? null, // when origin is hidden
  };
}

// ─── Update dispatcher ────────────────────────────────────────────────────────

function handleUpdate(update) {
  // Standard message (new or edited)
  const message = update.message ?? update.edited_message;
  if (message) return { updateType: "message", data: extractMessageData(message) };

  // Channel post (new or edited)
  const post = update.channel_post ?? update.edited_channel_post;
  if (post) return { updateType: "channel_post", data: extractMessageData(post) };

  // Inline query
  if (update.inline_query) {
    return {
      updateType: "inline_query",
      data: {
        id: update.inline_query.id,
        from: update.inline_query.from,
        query: update.inline_query.query,
        offset: update.inline_query.offset,
      },
    };
  }

  // Callback query (inline keyboard button press)
  if (update.callback_query) {
    const cq = update.callback_query;
    return {
      updateType: "callback_query",
      data: {
        id: cq.id,
        from: cq.from,
        message: cq.message ? extractMessageData(cq.message) : null,
        data: cq.data ?? null,
        gameShortName: cq.game_short_name ?? null,
      },
    };
  }

  // My chat member status update
  if (update.my_chat_member || update.chat_member) {
    const cm = update.my_chat_member ?? update.chat_member;
    return {
      updateType: update.my_chat_member ? "my_chat_member" : "chat_member",
      data: {
        chat: cm.chat,
        from: cm.from,
        date: new Date(cm.date * 1000).toISOString(),
        oldStatus: cm.old_chat_member?.status,
        newStatus: cm.new_chat_member?.status,
      },
    };
  }

  return { updateType: "unknown", data: update };
}

// ─── Webhook endpoint ─────────────────────────────────────────────────────────

app.post("/webhook", (req, res) => {
  // Acknowledge Telegram immediately (must respond within 5 s)
  res.sendStatus(200);

  try {
    const update = req.body;
    const result = handleUpdate(update);

    // console.log("Update type :", result.updateType);
    // console.log("Parsed data :", JSON.stringify(result.data, null, 2));

    // TODO: route to your business logic here, e.g.
    // if (result.updateType === "message") processMessage(result.data);

  } catch (err) {
    // TBD console.error("Failed to process update:", err);
  }
});

// app.listen(3000, () => console.log("Webhook listening on :3000"));