import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/chat_message.dart';
import 'image_viewer_screen.dart';
import 'media_gallery_screen.dart';
import '../../services/api_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  List<ChatMessage> _messages = [];
  bool _loading = true;
  Timer? _pollingTimer;
  String _chatStatus = 'open';
  bool _needsRating = false;
  bool _ratingSubmitted = false;
  XFile? _imageFile;
  Uint8List? _imageBytes;
  bool _hasNewMessages = false;
  int _lastMessageCount = 0;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    // Poll every 3 seconds for real-time feel
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (mounted) _loadMessages(silent: true);
    });
  }

  Future<void> _loadMessages({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final result = await ApiService.getMessagesWithStatus();
      if (!mounted) return;

      final newMessages = result['messages'] as List<ChatMessage>;
      final bool prevNeedsRating = _needsRating;
      final bool isAtBottom = _scrollCtrl.hasClients &&
          _scrollCtrl.position.pixels >=
              _scrollCtrl.position.maxScrollExtent - 80;

      setState(() {
        _messages = newMessages;
        _chatStatus = result['chat_status'] as String;
        _needsRating = result['needs_rating'] as bool;
        _loading = false;
        if (newMessages.length > _lastMessageCount &&
            _lastMessageCount > 0 &&
            !isAtBottom) {
          _hasNewMessages = true;
        }
        _lastMessageCount = newMessages.length;
      });

      // Auto-scroll if user is near bottom or initial load
      if (!silent || isAtBottom) {
        _scrollToBottom();
      }

      // Show rating popup if needed
      if (!prevNeedsRating && _needsRating && !_ratingSubmitted) {
        await Future.delayed(const Duration(milliseconds: 600));
        if (mounted) _showRatingDialog();
      }
    } catch (e) {
      if (!silent && mounted) {
        setState(() => _loading = false);
      }
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
        setState(() => _hasNewMessages = false);
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageCtrl.text.trim();
    if ((text.isEmpty && _imageFile == null) || _chatStatus == 'closed') return;

    setState(() => _sending = true);
    final currentMessage = text;
    final currentFile = _imageFile;

    _messageCtrl.clear();
    _clearImage();

    try {
      if (currentFile != null) {
        await ApiService.sendImageMessage(currentFile, caption: currentMessage);
      } else {
        await ApiService.sendMessage(currentMessage);
      }
      await _loadMessages(silent: true);
      _scrollToBottom();
    } catch (e) {
      debugPrint('Chat Send Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiService.parseError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _pickImage() async {
    if (_chatStatus == 'closed') return;
    final picker = ImagePicker();
    final picked =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    setState(() {
      _imageFile = picked;
      _imageBytes = bytes;
    });
  }

  void _clearImage() {
    setState(() {
      _imageFile = null;
      _imageBytes = null;
    });
  }

  void _showRatingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: const Color(0xFF128C7E).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.support_agent_rounded,
                    size: 40, color: Color(0xFF128C7E)),
              ),
              const SizedBox(height: 20),
              const Text(
                'Rate Our Service',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              const Text(
                'Are you happy with the work done for you?\nWere you served as you expected?',
                textAlign: TextAlign.center,
                style:
                    TextStyle(fontSize: 14, color: Colors.black54, height: 1.6),
              ),
              const SizedBox(height: 28),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _RatingOption(
                    icon: Icons.thumb_down_rounded,
                    label: 'Not really',
                    color: Colors.red.shade400,
                    onTap: () {
                      Navigator.of(ctx).pop();
                      _submitRating(false);
                    },
                  ),
                  _RatingOption(
                    icon: Icons.thumb_up_rounded,
                    label: 'Yes, happy!',
                    color: const Color(0xFF128C7E),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      _submitRating(true);
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitRating(bool liked) async {
    try {
      await ApiService.submitChatRating(liked);
      setState(() {
        _needsRating = false;
        _ratingSubmitted = true;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(liked
              ? '👍 Thank you for your positive feedback!'
              : '👎 Thank you for your feedback!'),
          backgroundColor:
              liked ? const Color(0xFF128C7E) : Colors.red.shade400,
        ));
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFECE5DD), // WhatsApp background color
      appBar: AppBar(
        backgroundColor: const Color(0xFF128C7E),
        foregroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 0,
        title: Row(
          children: [
            const CircleAvatar(
              backgroundColor: Colors.white24,
              radius: 20,
              child: Icon(Icons.store_rounded, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Store Support',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text(
                  _chatStatus == 'closed' ? 'Chat Closed' : 'Online',
                  style: TextStyle(
                    fontSize: 12,
                    color: _chatStatus == 'closed'
                        ? Colors.orange.shade200
                        : Colors.greenAccent.shade100,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.perm_media_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => MediaGalleryScreen(messages: _messages),
              ),
            ),
            tooltip: 'Shared Media',
          ),
          if (_needsRating)
            IconButton(
              icon: const Icon(Icons.star_rounded, color: Colors.yellow),
              onPressed: _showRatingDialog,
              tooltip: 'Rate service',
            ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          color: Color(0xFFE5DDD5), // WhatsApp light background color
        ),
        child: Column(
          children: [
            if (_chatStatus == 'closed')
              Container(
                color: Colors.orange.shade100,
                padding:
                    const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                child: const Row(
                  children: [
                    Icon(Icons.lock_outline, color: Colors.orange, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'This conversation has been closed by the store.',
                        style: TextStyle(
                            color: Colors.orange,
                            fontSize: 13,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: Stack(
                children: [
                  if (_loading && _messages.isEmpty)
                    const Center(
                        child:
                            CircularProgressIndicator(color: Color(0xFF128C7E)))
                  else if (_messages.isEmpty)
                    const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.chat_bubble_outline,
                              size: 64, color: Colors.grey),
                          SizedBox(height: 12),
                          Text('Start a conversation!',
                              style:
                                  TextStyle(color: Colors.grey, fontSize: 16)),
                        ],
                      ),
                    )
                  else
                    ListView.builder(
                      controller: _scrollCtrl,
                      padding: const EdgeInsets.symmetric(
                          vertical: 12, horizontal: 8),
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final msg = _messages[index];
                        final prevMsg = index > 0 ? _messages[index - 1] : null;
                        final showDate = prevMsg == null ||
                            !_isSameDay(prevMsg.createdAt, msg.createdAt);
                        return Column(
                          children: [
                            if (showDate) _DateSeparator(date: msg.createdAt),
                            _ChatBubble(message: msg),
                          ],
                        );
                      },
                    ),
                  // "New messages" indicator
                  if (_hasNewMessages)
                    Positioned(
                      bottom: 12,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: GestureDetector(
                          onTap: _scrollToBottom,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF128C7E),
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: const [
                                BoxShadow(color: Colors.black26, blurRadius: 6)
                              ],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.arrow_downward,
                                    color: Colors.white, size: 16),
                                SizedBox(width: 6),
                                Text('New messages',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            _buildInput(),
          ],
        ),
      ),
    );
  }

  Widget _buildInput() {
    final isClosed = _chatStatus == 'closed';
    return Container(
      color: const Color(0xFFF0F0F0),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: SafeArea(
        child: Row(
          children: [
            if (!isClosed)
              IconButton(
                icon: Icon(
                    _imageFile != null ? Icons.image : Icons.image_outlined,
                    color: const Color(0xFF128C7E),
                    size: 26),
                onPressed: _pickImage,
              ),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_imageFile != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade400),
                        image: DecorationImage(
                          image: MemoryImage(_imageBytes!),
                          fit: BoxFit.cover,
                        ),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            top: -8,
                            right: -8,
                            child: IconButton(
                              icon: const Icon(Icons.cancel,
                                  color: Colors.red, size: 20),
                              onPressed: _clearImage,
                            ),
                          ),
                        ],
                      ),
                    ),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: TextField(
                      controller: _messageCtrl,
                      enabled: !isClosed,
                      decoration: InputDecoration(
                        hintText: isClosed ? 'Chat is closed' : 'Message',
                        hintStyle: const TextStyle(color: Colors.grey),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 10),
                      ),
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      onSubmitted: isClosed ? null : (_) => _sendMessage(),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 6),
            if (!isClosed)
              GestureDetector(
                onTap: _sendMessage,
                child: Container(
                  width: 46,
                  height: 46,
                  decoration: const BoxDecoration(
                    color: Color(0xFF128C7E),
                    shape: BoxShape.circle,
                  ),
                  child: _sending
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(Icons.send_rounded,
                          color: Colors.white, size: 22),
                ),
              ),
          ],
        ),
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _messageCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }
}

class _DateSeparator extends StatelessWidget {
  final DateTime date;
  const _DateSeparator({required this.date});

  String _label() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final msgDay = DateTime(date.year, date.month, date.day);
    final diff = today.difference(msgDay).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFD1F4CC),
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 2)],
        ),
        child: Text(
          _label(),
          style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF4A4A4A),
              fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _RatingOption extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;
  const _RatingOption(
      {required this.icon,
      required this.color,
      required this.label,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(color: color, width: 2),
            ),
            child: Icon(icon, color: color, size: 34),
          ),
          const SizedBox(height: 8),
          Text(label,
              style: TextStyle(
                  color: color, fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;
  const _ChatBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final bool isMe = message.isFromCustomer;
    final bubbleColor = isMe ? const Color(0xFFDCF8C6) : Colors.white;
    const textColor = Colors.black87;
    final time =
        '${message.createdAt.hour}:${message.createdAt.minute.toString().padLeft(2, '0')}';

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: 4,
          left: isMe ? 64 : 8,
          right: isMe ? 8 : 64,
        ),
        decoration: BoxDecoration(
          color: bubbleColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(12),
            topRight: const Radius.circular(12),
            bottomLeft: Radius.circular(isMe ? 12 : 2),
            bottomRight: Radius.circular(isMe ? 2 : 12),
          ),
          boxShadow: const [
            BoxShadow(
                color: Colors.black12, blurRadius: 2, offset: Offset(0, 1))
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(12),
            topRight: const Radius.circular(12),
            bottomLeft: Radius.circular(isMe ? 12 : 2),
            bottomRight: Radius.circular(isMe ? 2 : 12),
          ),
          child: Column(
            crossAxisAlignment:
                isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              if (message.fullImageUrl != null)
                GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ImageViewerScreen(
                        imageUrl: message.fullImageUrl!,
                        caption: message.message != '[Image]'
                            ? message.message
                            : null,
                      ),
                    ),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: message.fullImageUrl!,
                    fit: BoxFit.cover,
                    width: 220,
                    placeholder: (_, __) => Container(
                      width: 220,
                      height: 140,
                      color: Colors.grey.shade200,
                      child: const Center(
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Color(0xFF128C7E))),
                    ),
                    errorWidget: (_, __, ___) => Container(
                      width: 220,
                      height: 80,
                      color: Colors.grey.shade200,
                      child: const Icon(Icons.broken_image, color: Colors.grey),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                child: Column(
                  crossAxisAlignment:
                      isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    if (message.message.isNotEmpty &&
                        message.message != '[Image]')
                      Text(message.message,
                          style:
                              const TextStyle(fontSize: 15, color: textColor)),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(time,
                            style: const TextStyle(
                                fontSize: 11, color: Colors.black38)),
                        if (isMe) ...[
                          const SizedBox(width: 3),
                          const Icon(Icons.done_all_rounded,
                              size: 14, color: Color(0xFF53BDEB)),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
