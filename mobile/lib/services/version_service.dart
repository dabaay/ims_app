import 'package:package_info_plus/package_info_plus.dart';
import 'api_service.dart';

class VersionInfo {
  final String installedVersion;
  final String latestVersion;
  final String downloadUrl;
  final bool hasUpdate;

  const VersionInfo({
    required this.installedVersion,
    required this.latestVersion,
    required this.downloadUrl,
    required this.hasUpdate,
  });
}

class VersionService {
  /// Fetches the backend app-version and compares with the installed version.
  static Future<VersionInfo> checkForUpdate() async {
    final info = await PackageInfo.fromPlatform();
    final installed = info.version; // e.g. "1.0.0"

    final data = await ApiService.getAppVersion(); // calls GET /api/app-version
    final latest = (data['app_version'] as String?) ?? installed;
    final downloadUrl = (data['app_download_url'] as String?) ?? '';

    final hasUpdate = _isNewer(latest, installed);

    return VersionInfo(
      installedVersion: installed,
      latestVersion: latest,
      downloadUrl: downloadUrl,
      hasUpdate: hasUpdate,
    );
  }

  /// Returns true when [remote] is strictly greater than [local].
  /// Compares major.minor.patch segments numerically.
  static bool _isNewer(String remote, String local) {
    try {
      final r = remote.split('.').map(int.parse).toList();
      final l = local.split('.').map(int.parse).toList();
      for (int i = 0; i < 3; i++) {
        final rv = i < r.length ? r[i] : 0;
        final lv = i < l.length ? l[i] : 0;
        if (rv > lv) return true;
        if (rv < lv) return false;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
