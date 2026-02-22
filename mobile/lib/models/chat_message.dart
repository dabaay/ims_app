import '../constants/api_constants.dart';

class ChatMessage {
  final int id;
  final int customerId;
  final int? userId;
  final String message;
  final String? imagePath;
  final String? imageUrl;
  final bool isFromCustomer;
  final bool isRead;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.customerId,
    this.userId,
    required this.message,
    this.imagePath,
    this.imageUrl,
    required this.isFromCustomer,
    required this.isRead,
    required this.createdAt,
  });

  String? get fullImageUrl {
    if (imagePath == null) return null;
    return '$kMediaBaseUrl/$imagePath';
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: int.parse(json['id'].toString()),
      customerId: int.parse(json['customer_id'].toString()),
      userId: json['user_id'] != null
          ? int.tryParse(json['user_id'].toString())
          : null,
      message: json['message']?.toString() ?? '',
      imagePath: json['image_path']?.toString(),
      imageUrl: json['image_url']?.toString(),
      isFromCustomer: json['is_from_customer'] == true ||
          json['is_from_customer'] == 1 ||
          json['is_from_customer']?.toString() == 'true',
      isRead: json['is_read'] == true ||
          json['is_read'] == 1 ||
          json['is_read']?.toString() == 'true',
      createdAt: DateTime.parse(json['created_at'].toString()),
    );
  }
}
