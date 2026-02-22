import 'package:flutter/material.dart';
import '../models/product.dart';

class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});
}

class CartProvider extends ChangeNotifier {
  final Map<int, CartItem> _items = {};

  Map<int, CartItem> get items => _items;
  int get itemCount => _items.values.fold(0, (sum, c) => sum + c.quantity);

  double get totalAmount => _items.values
      .fold(0.0, (sum, c) => sum + c.product.activePrice * c.quantity);

  void addItem(Product product) {
    if (_items.containsKey(product.productId)) {
      _items[product.productId]!.quantity++;
    } else {
      _items[product.productId] = CartItem(product: product);
    }
    notifyListeners();
  }

  void removeItem(int productId) {
    _items.remove(productId);
    notifyListeners();
  }

  void decrementItem(int productId) {
    if (!_items.containsKey(productId)) return;
    if (_items[productId]!.quantity > 1) {
      _items[productId]!.quantity--;
    } else {
      _items.remove(productId);
    }
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }

  List<Map<String, dynamic>> toOrderItems() {
    return _items.values
        .map((c) => {'product_id': c.product.productId, 'quantity': c.quantity})
        .toList();
  }
}
