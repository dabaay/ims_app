import 'product.dart';

class Promotion {
  final int promotionId;
  final String title;
  final String? description;
  final String? imagePath;
  final String? imageUrl;
  final bool isActive;
  final int? productId;
  final Product? product;
  final DateTime? startDate;
  final DateTime? endDate;

  Promotion({
    required this.promotionId,
    required this.title,
    this.description,
    this.imagePath,
    this.imageUrl,
    this.isActive = true,
    this.productId,
    this.product,
    this.startDate,
    this.endDate,
  });

  factory Promotion.fromJson(Map<String, dynamic> json) {
    String? imageUrl = json['image_url'] as String?;
    if (imageUrl != null && imageUrl.contains('localhost')) {
      imageUrl = imageUrl.replaceFirst('localhost', '127.0.0.1');
    }

    return Promotion(
      promotionId: json['promotion_id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      imagePath: json['image_path'] as String?,
      imageUrl: imageUrl,
      isActive: json['is_active'] == true || json['is_active'] == 1,
      productId: json['product_id'] as int?,
      product: json['product'] != null
          ? Product.fromJson(json['product'] as Map<String, dynamic>)
          : null,
      startDate: json['start_date'] != null
          ? DateTime.parse(json['start_date'] as String)
          : null,
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'] as String)
          : null,
    );
  }
}
