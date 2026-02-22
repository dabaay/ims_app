import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../services/api_service.dart';
import '../../providers/cart_provider.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late Product _product;

  @override
  void initState() {
    super.initState();
    _product = widget.product;
    _refreshProduct();
  }

  Future<void> _refreshProduct() async {
    try {
      final p = await ApiService.getProduct(_product.productId);
      if (mounted) setState(() => _product = p);
    } catch (_) {}
  }

  Future<void> _toggleFavorite() async {
    try {
      if (_product.isFavorite) {
        await ApiService.removeFavorite(_product.productId);
      } else {
        await ApiService.addFavorite(_product.productId);
      }
      setState(() => _product.isFavorite = !_product.isFavorite);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(ApiService.parseError(e)),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  void _addToCart() {
    context.read<CartProvider>().addItem(_product);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content: Text('Added to cart!'), behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: const Color(0xFF1565C0),
            foregroundColor: Colors.white,
            actions: [
              IconButton(
                icon: Icon(
                    _product.isFavorite
                        ? Icons.favorite
                        : Icons.favorite_border,
                    color: _product.isFavorite ? Colors.red : Colors.white),
                onPressed: _toggleFavorite,
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _product.imageUrl != null
                  ? Image.network(
                      _product.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: Colors.grey[300],
                        child: const Icon(Icons.image,
                            size: 80, color: Colors.grey),
                      ),
                    )
                  : Container(
                      color: Colors.grey[300],
                      child:
                          const Icon(Icons.image, size: 80, color: Colors.grey),
                    ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_product.name,
                                style: const TextStyle(
                                    fontSize: 22, fontWeight: FontWeight.bold)),
                            if (_product.isOnDiscount)
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(4),
                                  border:
                                      Border.all(color: Colors.red.shade200),
                                ),
                                child: Text(
                                  'SAVE ${_product.discountPercentage}%',
                                  style: TextStyle(
                                      color: Colors.red[700],
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold),
                                ),
                              ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                              '\$${(_product.isOnDiscount ? _product.discountPrice : _product.sellingPrice)?.toStringAsFixed(2)}',
                              style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1565C0))),
                          if (_product.isOnDiscount)
                            Text(
                              '\$${_product.sellingPrice.toStringAsFixed(2)}',
                              style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[500],
                                  decoration: TextDecoration.lineThrough),
                            ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      ...List.generate(
                          5,
                          (i) => Icon(
                                i < _product.averageRating.round()
                                    ? Icons.star
                                    : Icons.star_border,
                                color: Colors.amber,
                                size: 20,
                              )),
                      const SizedBox(width: 8),
                      Text(
                          '${_product.averageRating} (${_product.ratingCount ?? 0} ratings)',
                          style: TextStyle(color: Colors.grey[600])),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _product.currentStock > 0
                          ? Colors.green.shade50
                          : Colors.red.shade50,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: _product.currentStock > 0
                            ? Colors.green
                            : Colors.red,
                      ),
                    ),
                    child: Text(
                      _product.currentStock > 0
                          ? 'In Stock (${_product.currentStock})'
                          : 'Out of Stock',
                      style: TextStyle(
                        color: _product.currentStock > 0
                            ? Colors.green[700]
                            : Colors.red,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  if (_product.description != null &&
                      _product.description!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text('Description',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text(_product.description!,
                        style: TextStyle(color: Colors.grey[700], height: 1.5)),
                  ],
                  if (_product.category != null) ...[
                    const SizedBox(height: 12),
                    Row(children: [
                      const Text('Category: ',
                          style: TextStyle(fontWeight: FontWeight.w600)),
                      Text(_product.category!),
                    ]),
                  ],
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Customer Reviews',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold)),
                      TextButton(
                        onPressed: _showRateDialog,
                        child: const Text('Add Review'),
                      ),
                    ],
                  ),
                  if (_product.comments == null || _product.comments!.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                          child: Text('No reviews yet. Be the first!',
                              style: TextStyle(color: Colors.grey[500]))),
                    )
                  else
                    ..._product.comments!.map((c) => _CommentTile(comment: c)),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _product.currentStock > 0 ? _addToCart : null,
                      icon: const Icon(Icons.add_shopping_cart),
                      label: const Text('Add to Cart',
                          style: TextStyle(fontSize: 16)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1565C0),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showRateDialog() {
    int selectedRating = 5;
    final commentCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Rate Product'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                    5,
                    (i) => IconButton(
                          icon: Icon(
                            i < selectedRating ? Icons.star : Icons.star_border,
                            color: Colors.amber,
                            size: 32,
                          ),
                          onPressed: () =>
                              setDialogState(() => selectedRating = i + 1),
                        )),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: commentCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Share your thoughts (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                try {
                  await ApiService.rateProduct(
                      _product.productId, selectedRating,
                      comment: commentCtrl.text.trim());
                  if (!context.mounted) return;
                  Navigator.pop(context);
                  _refreshProduct();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Review submitted!')),
                  );
                } catch (e) {
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(ApiService.parseError(e))),
                  );
                }
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}

class _CommentTile extends StatelessWidget {
  final dynamic comment;
  const _CommentTile({required this.comment});

  @override
  Widget build(BuildContext context) {
    final customer = comment['customer'] ?? {};
    final String name = customer['full_name'] ?? 'Unknown User';
    final int rating = comment['rating'] ?? 0;
    final String? text = comment['comment'];

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: Colors.blue[100],
                child: Text(name[0], style: const TextStyle(fontSize: 10)),
              ),
              const SizedBox(width: 8),
              Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
              const Spacer(),
              ...List.generate(
                  5,
                  (i) => Icon(
                        i < rating ? Icons.star : Icons.star_border,
                        color: Colors.amber,
                        size: 14,
                      )),
            ],
          ),
          if (text != null && text.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(text, style: TextStyle(color: Colors.grey[800], fontSize: 13)),
          ],
          const SizedBox(height: 8),
          const Divider(height: 1),
        ],
      ),
    );
  }
}
