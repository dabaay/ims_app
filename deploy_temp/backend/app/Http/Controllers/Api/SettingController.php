<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    /**
     * Get all system settings.
     */
    public function index()
    {
        $settings = SystemSetting::all();
        
        // Format as key-value pairs for easier frontend usage
        $formatted = [];
        foreach ($settings as $setting) {
            $value = $setting->setting_value;
            
            // Cast based on type
            if ($setting->setting_type === 'boolean') {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            } elseif ($setting->setting_type === 'json' && $value) {
                $value = json_decode($value, true);
            }
            
            $formatted[$setting->setting_key] = $value;
        }

        return response()->json($formatted);
    }

    /**
     * Update multiple settings at once.
     */
    public function update(Request $request)
    {
        $settings = $request->except(['user_id', 'token']); // Basic cleanup

        foreach ($settings as $key => $value) {
            $setting = SystemSetting::where('setting_key', $key)->first();
            
            if ($setting) {
                // If it's a file upload for the logo
                if ($key === 'store_logo' && $request->hasFile('store_logo')) {
                    // Delete old logo if exists
                    if ($setting->setting_value) {
                        Storage::disk('public')->delete($setting->setting_value);
                    }
                    
                    $path = $request->file('store_logo')->store('branding', 'public');
                    $value = $path;
                }

                // Handle boolean conversion if needed
                if ($setting->setting_type === 'boolean') {
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
                }

                $setting->update([
                    'setting_value' => is_array($value) ? json_encode($value) : $value,
                    'updated_by' => auth()->id() ?? $request->user_id
                ]);
            }
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    /**
     * Get a specific setting by key.
     */
    public function show($key)
    {
        $setting = SystemSetting::where('setting_key', $key)->first();
        
        if (!$setting) {
            return response()->json(['message' => 'Setting not found'], 404);
        }

        return response()->json($setting);
    }

    /**
     * Public endpoint: returns current app version and download URL.
     */
    public function appVersion()
    {
        $version = SystemSetting::where('setting_key', 'app_version')->value('setting_value') ?? '1.0.0';
        $downloadUrl = SystemSetting::where('setting_key', 'app_download_url')->value('setting_value') ?? '';

        return response()->json([
            'app_version'      => $version,
            'app_download_url' => $downloadUrl,
        ]);
    }
}
