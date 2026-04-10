import Chat from '../models/Chat.js';

// @POST /api/chats  — start or get existing chat
export const getOrCreateChat = async (req, res, next) => {
  try {
    const { receiverId, refType, refId } = req.body;
    const senderId = req.user._id;

    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
      refId,
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId],
        refType,
        refId,
      });
    }

    res.json({ success: true, chat });
  } catch (err) { next(err); }
};

// @GET /api/chats  — my chats list
export const getMyChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name avatar phone')
      .sort({ lastMessageAt: -1 })
      .select('-messages');
    res.json({ success: true, chats });
  } catch (err) { next(err); }
};

// @GET /api/chats/:id/messages
export const getChatMessages = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id,
    }).populate('messages.sender', 'name avatar');
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    // Mark messages as read
    chat.messages.forEach((m) => {
      if (m.sender._id?.toString() !== req.user._id.toString()) m.isRead = true;
    });
    await chat.save();

    res.json({ success: true, messages: chat.messages });
  } catch (err) { next(err); }
};

// @POST /api/chats/:id/messages  — send message (REST fallback)
export const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const msg = { sender: req.user._id, text };
    chat.messages.push(msg);
    chat.lastMessage = text;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json({ success: true, message: msg });
  } catch (err) { next(err); }
};
