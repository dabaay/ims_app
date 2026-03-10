class Product {
  final int productId;
  final String name;
  final String? description;
  final String? imagePath;
  final String? imageUrl; // full URL from backend
  final double sellingPrice;
  final int currentStock;
  final double averageRating;
  bool isFavorite;
  final String? category;
  final String? unit;
  final int? ratingCount;
  final List<dynamic>? comments;
  final double? discountPrice;
  final DateTime? discountStartDate;
  final DateTime? discountEndDate;
  final bool isPromotion;

  bool get isOnDiscount {
    final now = DateTime.now();
    return discountPrice != null &&
        discountPrice! > 0 &&
        (discountStartDate == null || discountStartDate!.isBefore(now)) &&
        (discountEndDate == null || discountEndDate!.isAfter(now));
  }

  Product({
    required this.productId,
    required this.name,
    this.description,
    this.imagePath,
    this.imageUrl,
    required this.sellingPrice,
    required this.currentStock,
    required this.averageRating,
    required this.isFavorite,
    this.category,
    this.unit,
    this.ratingCount,
    this.comments,
    this.discountPrice,
    this.discountStartDate,
    this.discountEndDate,
    this.isPromotion = false,
  });

  int get discountPercentage {
    if (!isOnDiscount || discountPrice == null || sellingPrice <= 0) return 0;
    final diff = sellingPrice - discountPrice!;
    return ((diff / sellingPrice) * 100).round();
  }

  double get activePrice =>
      isOnDiscount ? (discountPrice ?? sellingPrice) : sellingPrice;

  factory Product.fromJson(Map<String, dynamic> json) {
    // Handle both Laravel standard keys and the "legacy/bridge" keys
    final pId = json['product_id'] ?? json['p_id'];
    final pName = json['name'] ?? json['p_name'];
    final pImg = json['image_path'] ?? json['p_image'];
    final isPromo = json['is_promotion'] == true || json['is_promotion'] == 1;

    String? imageUrl = (json['image_url'] ?? json['url']) as String?;
    if (imageUrl != null && imageUrl.contains('localhost')) {
      imageUrl = imageUrl.replaceFirst('localhost', '127.0.0.1');
    }

    return Product(
      productId: pId as int,
      name: pName as String,
      description: json['description'] as String?,
      imagePath: pImg as String?,
      imageUrl: imageUrl,
      sellingPrice: double.parse(json['selling_price']?.toString() ?? '0'),
      currentStock: json['current_stock'] as int? ?? 0,
      averageRating: double.parse(json['average_rating']?.toString() ?? '0'),
      isFavorite: json['is_favorite'] == true || json['is_favorite'] == 1,
      category: json['category'] as String?,
      unit: json['unit'] as String?,
      ratingCount: json['rating_count'] as int?,
      comments: json['comments'] as List<dynamic>?,
      discountPrice: json['discount_price'] != null
          ? double.parse(json['discount_price'].toString())
          : null,
      discountStartDate: json['discount_start_date'] != null
          ? DateTime.parse(json['discount_start_date'] as String)
          : null,
      discountEndDate: json['discount_end_date'] != null
          ? DateTime.parse(json['discount_end_date'] as String)
          : null,
      isPromotion: isPromo,
    );
  }
}
