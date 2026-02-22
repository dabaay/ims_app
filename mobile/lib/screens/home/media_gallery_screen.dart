import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/chat_message.dart';
import 'image_viewer_screen.dart';

class MediaGalleryScreen extends StatelessWidget {
  final List<ChatMessage> messages;

  const MediaGalleryScreen({super.key, required this.messages});

  @override
  Widget build(BuildContext context) {
    final mediaMessages =
        messages.where((m) => m.imagePath != null).toList().reversed.toList();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Shared Media'),
        centerTitle: true,
      ),
      body: mediaMessages.isEmpty
          ? const Center(
              child: Text(
                'No media shared yet',
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(8),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 4,
                mainAxisSpacing: 4,
              ),
              itemCount: mediaMessages.length,
              itemBuilder: (context, index) {
                final msg = mediaMessages[index];
                final url = msg.fullImageUrl ?? '';

                return GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ImageViewerScreen(
                        imageUrl: url,
                        caption: msg.message != '[Image]' ? msg.message : null,
                      ),
                    ),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: url,
                    fit: BoxFit.cover,
                    placeholder: (context, url) =>
                        Container(color: Colors.grey[200]),
                    errorWidget: (context, url, error) =>
                        const Icon(Icons.broken_image),
                  ),
                );
              },
            ),
    );
  }
}
