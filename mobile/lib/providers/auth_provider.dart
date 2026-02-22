import 'package:flutter/material.dart';
import '../models/customer.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  Customer? _customer;
  bool _isLoading = false;

  Customer? get customer => _customer;
  bool get isLoggedIn => _customer != null;
  bool get isLoading => _isLoading;

  Future<void> tryAutoLogin() async {
    if (await AuthService.isLoggedIn()) {
      await ApiService.init();
      try {
        _customer = await ApiService.getProfile();
        notifyListeners();
      } catch (_) {
        // Token expired or invalid — clear session
        await AuthService.logout();
      }
    }
  }

  Future<String?> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();
    final result = await AuthService.login(username, password);
    _isLoading = false;
    if (result['success'] == true) {
      _customer = result['customer'] as Customer;
      notifyListeners();
      return null;
    }
    notifyListeners();
    return result['message'] as String;
  }

  Future<String?> register(Map<String, dynamic> userData) async {
    _isLoading = true;
    notifyListeners();
    final result = await AuthService.register(userData);
    _isLoading = false;
    if (result['success'] == true) {
      _customer = result['customer'] as Customer;
      notifyListeners();
      return null;
    }
    notifyListeners();
    return result['message'] as String;
  }

  Future<void> logout() async {
    await AuthService.logout();
    _customer = null;
    notifyListeners();
  }

  void updateCustomer(Customer c) {
    _customer = c;
    notifyListeners();
  }

  Future<String?> forgotPassword(String identifier) async {
    _isLoading = true;
    notifyListeners();
    final result = await AuthService.forgotPassword(identifier);
    _isLoading = false;
    notifyListeners();
    if (result['success'] == true)
      return null; // null means success, message is handled by UI
    return result['message'] as String;
  }
}
