class Customer {
  final int customerId;
  final String fullName;
  final String username;
  final String phone;
  final String? address;
  final double creditLimit;
  final double currentBalance;
  final String status;
  final String? profileImage;
  final bool isMobileUser;
  final double totalPurchases;

  Customer({
    required this.customerId,
    required this.fullName,
    required this.username,
    required this.phone,
    this.address,
    required this.creditLimit,
    required this.currentBalance,
    required this.status,
    this.profileImage,
    this.isMobileUser = true,
    this.totalPurchases = 0,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      customerId: json['customer_id'] as int,
      fullName: json['full_name'] as String,
      username: (json['username'] as String?) ?? '',
      phone: json['phone'] as String,
      address: json['address'] as String?,
      creditLimit: double.parse(json['credit_limit']?.toString() ?? '0'),
      currentBalance: double.parse(json['current_balance']?.toString() ?? '0'),
      status: json['status'] as String,
      profileImage: json['profile_image'] as String?,
      isMobileUser:
          json['is_mobile_user'] == true || json['is_mobile_user'] == 1,
      totalPurchases: double.parse(json['total_purchases']?.toString() ?? '0'),
    );
  }
}
