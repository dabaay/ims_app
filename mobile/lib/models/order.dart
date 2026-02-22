import 'product.dart';

class OrderItem {
  final int quantity;
  final double unitPrice;
  final double subtotal;
  final Product? product;

  OrderItem({
    required this.quantity,
    required this.unitPrice,
    required this.subtotal,
    this.product,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      quantity:  json['quantity'] as int,
      unitPrice: double.parse(json['unit_price']?.toString() ?? '0'),
      subtotal:  double.parse(json['subtotal']?.toString() ?? '0'),
      product:   json['product'] != null ? Product.fromJson(json['product'] as Map<String, dynamic>) : null,
    );
  }
}

class Order {
  final int saleId;
  final String invoiceNumber;
  final DateTime saleDate;
  final double totalAmount;
  final String paymentMethod;
  final String paymentStatus;
  final String? notes;
  final List<OrderItem> saleItems;

  Order({
    required this.saleId,
    required this.invoiceNumber,
    required this.saleDate,
    required this.totalAmount,
    required this.paymentMethod,
    required this.paymentStatus,
    this.notes,
    required this.saleItems,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      saleId:        json['sale_id'] as int,
      invoiceNumber: json['invoice_number'] as String,
      saleDate:      DateTime.parse(json['sale_date'] as String),
      totalAmount:   double.parse(json['total_amount']?.toString() ?? '0'),
      paymentMethod: json['payment_method'] as String,
      paymentStatus: json['payment_status'] as String,
      notes:         json['notes'] as String?,
      saleItems:     ((json['sale_items'] ?? []) as List)
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  bool get isPending   => paymentStatus == 'pending';
  bool get isPaid      => paymentStatus == 'paid';
  bool get isCancelled => paymentStatus == 'cancelled';
}
