<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send an SMS message.
     * Currently logs the message to storage/logs/sms.log for verification as requested by the user's "not in real time" and verification requirement.
     * 
     * @param string $phone
     * @param string $message
     * @return bool
     */
    public function sendSms(string $phone, string $message)
    {
        Log::build([
            'driver' => 'single',
            'path' => storage_path('logs/sms.log'),
        ])->info("SMS Sent to {$phone}: {$message}");

        return true;
    }
}
