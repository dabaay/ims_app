import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../models/customer.dart';
import '../models/chat_message.dart';
import '../constants/api_constants.dart';

class ApiService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: kBaseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Accept': 'application/json'},
  ));

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token != null) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  static void setToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  static void clearToken() {
    _dio.options.headers.remove('Authorization');
  }

  // ─── Dashboard ───────────────────────────────────────────────
  static Future<Map<String, dynamic>> getDashboard() async {
    final res = await _dio.get('/dashboard');
    return res.data['data'] as Map<String, dynamic>;
  }

  // ─── App Version (public, no auth needed) ────────────────────
  static Future<Map<String, dynamic>> getAppVersion() async {
    final res = await Dio(BaseOptions(
      baseUrl: kBaseUrl,
      headers: {'Accept': 'application/json'},
    )).get('/app-version');
    return res.data as Map<String, dynamic>;
  }

  // ─── Products ────────────────────────────────────────────────
  static Future<List<Product>> getProducts(
      {String? search, String? category, int page = 1}) async {
    final params = <String, dynamic>{'page': page};
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (category != null && category.isNotEmpty) params['category'] = category;

    final res = await _dio.get('/products', queryParameters: params);
    final list = (res.data['data']['data'] as List);
    return list
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Product> getProduct(int id) async {
    final res = await _dio.get('/products/$id');
    return Product.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  static Future<void> rateProduct(int id, int rating, {String? comment}) async {
    await _dio.post('/products/$id/rate',
        data: {'rating': rating, 'comment': comment});
  }

  // ─── Favorites ───────────────────────────────────────────────
  static Future<List<Product>> getFavorites() async {
    final res = await _dio.get('/favorites');
    return (res.data['data'] as List)
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<void> addFavorite(int productId) async {
    await _dio.post('/favorites/$productId');
  }

  static Future<void> removeFavorite(int productId) async {
    await _dio.delete('/favorites/$productId');
  }

  // ─── Orders ──────────────────────────────────────────────────
  static Future<List<Order>> getOrders() async {
    final res = await _dio.get('/orders');
    return (res.data['data'] as List)
        .map((e) => Order.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Order> createOrder(Map<String, dynamic> orderData) async {
    final res = await _dio.post('/orders', data: orderData);
    return Order.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  static Future<void> cancelOrder(int id) async {
    await _dio.post('/orders/$id/cancel');
  }

  // ─── Profile ─────────────────────────────────────────────────
  static Future<Customer> getProfile() async {
    final res = await _dio.get('/profile');
    return Customer.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  static Future<Customer> updateProfile(Map<String, dynamic> data) async {
    final res = await _dio.post('/profile', data: data);
    return Customer.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  static Future<void> changePassword(String current, String fresh) async {
    await _dio.post('/change-password', data: {
      'current_password': current,
      'new_password': fresh,
      'new_password_confirmation': fresh,
    });
  }

  // ─── Store Info ──────────────────────────────────────────────
  static Future<Map<String, dynamic>> getStoreInfo() async {
    final res = await _dio.get('/store-info');
    return res.data['data'] as Map<String, dynamic>;
  }

  // ─── Chat ────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getMessagesWithStatus() async {
    final res = await _dio.get('/chat/messages');
    final data = res.data;
    return {
      'messages': (data['data'] as List)
          .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
          .toList(),
      'chat_status': data['chat_status'] ?? 'open',
      'needs_rating': data['needs_rating'] ?? false,
    };
  }

  static Future<List<ChatMessage>> getMessages() async {
    final result = await getMessagesWithStatus();
    return result['messages'] as List<ChatMessage>;
  }

  static Future<ChatMessage> sendMessage(String message) async {
    final res = await _dio.post('/chat/messages', data: {'message': message});
    return ChatMessage.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  static Future<ChatMessage> sendImageMessage(XFile file,
      {String? caption}) async {
    // We switch to raw http.MultipartRequest because Dio's MultipartFile
    // can trigger dart:io errors in some hybrid web/native environments.
    final uri = Uri.parse('$kBaseUrl/chat/upload-screenshot');
    final request = http.MultipartRequest('POST', uri);

    // Add Authorization header manually
    final token = _dio.options.headers['Authorization'];
    if (token != null) {
      request.headers['Authorization'] = token.toString();
    }
    request.headers['Accept'] = 'application/json';

    // Add fields
    if (caption != null && caption.isNotEmpty) {
      request.fields['message'] = caption;
    }

    // Add file
    final bytes = await file.readAsBytes();
    request.files.add(http.MultipartFile.fromBytes(
      'image',
      bytes,
      filename: file.name,
    ));

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final decoded = jsonDecode(res.body);
      return ChatMessage.fromJson(decoded['data'] as Map<String, dynamic>);
    } else {
      // Create a dummy DioException-like error for ApiService.parseError to handle
      throw DioException(
        requestOptions: RequestOptions(path: uri.toString()),
        response: Response(
          requestOptions: RequestOptions(path: uri.toString()),
          data: jsonDecode(res.body),
          statusCode: res.statusCode,
        ),
      );
    }
  }

  static Future<void> submitChatRating(bool liked) async {
    await _dio.post('/chat/rate', data: {'rating': liked ? 1 : 0});
  }

  // ─── Error helper ────────────────────────────────────────────
  static String parseError(dynamic e) {
    if (e is DioException) {
      final data = e.response?.data;
      final statusCode = e.response?.statusCode;

      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
      if (data is Map && data['errors'] != null) {
        final errors = data['errors'] as Map;
        return errors.values.first is List
            ? (errors.values.first as List).first.toString()
            : errors.values.first.toString();
      }

      if (statusCode != null) {
        if (statusCode == 413) {
          return 'Image too large. Please pick a smaller file.';
        }
        if (statusCode >= 500) {
          return 'Server error ($statusCode). Please try again later.';
        }
        return 'Error ($statusCode): ${e.response?.statusMessage ?? 'Unknown'}';
      }

      if (e.type == DioExceptionType.cancel) {
        return 'Request cancelled.';
      }

      return e.message ?? 'An unexpected error occurred. Please try again.';
    }
    return 'DEBUG ERROR: ${e.toString()} (Check terminal)';
  }
}
