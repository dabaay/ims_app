class ApiConstants {
  // Set this to true when deploying to production
  static const bool isProduction = true;

  // Replace with your Bluehost Domain URL (e.g., https://yourdomain.com)
  static const String _prodUrl = 'https://yourdomain.com';
  static const String _devUrl =
      'http://127.0.0.1:8000'; // Change to PC IP if testing on physical device

  static String get baseUrl =>
      isProduction ? '$_prodUrl/api/mobile' : '$_devUrl/api/mobile';
  static String get mediaBaseUrl =>
      isProduction ? '$_prodUrl/storage' : '$_devUrl/storage';
}

// Keep these for backward compatibility if needed, but prefer using ApiConstants class
String get kBaseUrl => ApiConstants.baseUrl;
String get kMediaBaseUrl => ApiConstants.mediaBaseUrl;
