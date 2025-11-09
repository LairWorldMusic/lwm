<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Определяем корень проекта (на два уровня выше от site/api/)
function getProjectRoot() {
    return dirname(dirname(__DIR__));
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешен'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Получение данных
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Нет данных'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Валидация
$name = trim($input['name'] ?? '');
$contact = trim($input['contact'] ?? '');
$text = trim($input['text'] ?? '');

if (empty($name) || empty($contact) || empty($text)) {
    http_response_code(400);
    echo json_encode(['error' => 'Все поля обязательны для заполнения'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strlen($name) > 100 || strlen($contact) > 100 || strlen($text) > 1000) {
    http_response_code(400);
    echo json_encode(['error' => 'Превышена максимальная длина полей'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Rate limiting: проверка лимита отправки обращений (раз в 24 часа)
// Используем файловую систему вместо SQLite (так как PDO SQLite может быть не установлен)
$project_root = getProjectRoot();
$rate_limit_dir = $project_root . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'rate_limits';
if (!is_dir($rate_limit_dir)) {
    if (!mkdir($rate_limit_dir, 0755, true)) {
        error_log("Failed to create rate limit directory: " . $rate_limit_dir);
    }
}
// Убеждаемся, что директория доступна для записи
if (!is_writable($rate_limit_dir)) {
    error_log("Rate limit directory is not writable: " . $rate_limit_dir);
}

// Используем IP адрес и контакт как идентификатор
// Получаем реальный IP адрес (учитываем прокси)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $forwarded_ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
    $ip = trim($forwarded_ips[0]);
} elseif (isset($_SERVER['HTTP_X_REAL_IP'])) {
    $ip = $_SERVER['HTTP_X_REAL_IP'];
}
$identifier = md5($ip . '|' . $contact);
$limit_seconds = 24 * 60 * 60; // 24 часа в секундах
$current_time = time();

// Файл для хранения времени последней отправки
$rate_limit_file = $rate_limit_dir . DIRECTORY_SEPARATOR . $identifier . '.txt';

// Отладочная информация (можно убрать после проверки)
error_log("Rate limit check - IP: {$ip}, Contact: {$contact}, Identifier: {$identifier}, File: {$rate_limit_file}");

// Проверяем последнюю отправку
$last_submit_time = null;
if (file_exists($rate_limit_file)) {
    if (is_readable($rate_limit_file)) {
        $file_content = @file_get_contents($rate_limit_file);
        if ($file_content !== false && $file_content !== '') {
            $last_submit_time = (int)trim($file_content);
            error_log("Rate limit - File exists, last_submit_time: {$last_submit_time}, current_time: {$current_time}");
            
            if ($last_submit_time > 0) {
                $time_since_last = $current_time - $last_submit_time;
                error_log("Rate limit - Time since last: {$time_since_last} seconds, limit: {$limit_seconds} seconds");
                
                // Проверяем, прошло ли 24 часа
                if ($time_since_last < $limit_seconds) {
                    $hours_left = floor(($limit_seconds - $time_since_last) / 3600);
                    $minutes_left = floor((($limit_seconds - $time_since_last) % 3600) / 60);
                    error_log("Rate limit - BLOCKED: {$hours_left} hours {$minutes_left} minutes left");
                    http_response_code(429);
                    echo json_encode([
                        'error' => "Вы можете отправить обращение только раз в 24 часа. Попробуйте через {$hours_left} ч. {$minutes_left} мин."
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                } else {
                    error_log("Rate limit - ALLOWED: {$time_since_last} seconds passed (limit: {$limit_seconds} seconds)");
                }
            } else {
                error_log("Rate limit - Invalid timestamp: {$last_submit_time}");
            }
        } else {
            error_log("Rate limit - File is empty or unreadable: {$rate_limit_file}");
        }
    } else {
        error_log("Rate limit - File exists but not readable: {$rate_limit_file}");
    }
} else {
    error_log("Rate limit - File does not exist: {$rate_limit_file} (first submission allowed)");
}

// Экранирование для командной строки
$nameEscaped = escapeshellarg($name);
$contactEscaped = escapeshellarg($contact);
$textEscaped = escapeshellarg($text);

// Путь к Python скрипту (в той же директории)
$scriptPath = __DIR__ . DIRECTORY_SEPARATOR . 'send_appeal.py';

// Проверка существования файла
if (!file_exists($scriptPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Python скрипт не найден: ' . $scriptPath], JSON_UNESCAPED_UNICODE);
    exit;
}

// Вызов Python скрипта
// На Windows используем python, на Linux/Mac - python3
$pythonCmd = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') ? 'python' : 'python3';

// Сохраняем текущую рабочую директорию
$oldCwd = getcwd();

// Меняем рабочую директорию на директорию скрипта
$scriptDir = __DIR__;
chdir($scriptDir);

// Используем относительный путь - просто имя файла
$scriptName = 'send_appeal.py';

// Формируем команду: python "имя_файла" "аргумент1" "аргумент2" "аргумент3"
$command = $pythonCmd . ' ' . escapeshellarg($scriptName) . ' ' . $nameEscaped . ' ' . $contactEscaped . ' ' . $textEscaped . ' 2>&1';
$output = [];
$returnCode = 0;
exec($command, $output, $returnCode);

// Возвращаем рабочую директорию обратно
chdir($oldCwd);

$outputStr = implode("\n", $output);

// Отладочная информация
error_log("Python script output: " . $outputStr);
error_log("Python script return code: " . $returnCode);

// Проверяем успешность отправки (скрипт выводит "OK:" при успехе)
$is_success = ($returnCode === 0 && (stripos($outputStr, 'OK') !== false || stripos($outputStr, 'Отправлено') !== false));
error_log("Is success: " . ($is_success ? 'yes' : 'no'));

if ($is_success) {
    // Обновляем время последней отправки только после успешной отправки
    // Пересчитываем путь к файлу (переменные могут быть недоступны после exec)
    $project_root = getProjectRoot();
    $rate_limit_dir = $project_root . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'rate_limits';
    
    // Получаем IP и контакт снова
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $forwarded_ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($forwarded_ips[0]);
    } elseif (isset($_SERVER['HTTP_X_REAL_IP'])) {
        $ip = $_SERVER['HTTP_X_REAL_IP'];
    }
    $identifier = md5($ip . '|' . $contact);
    $rate_limit_file = $rate_limit_dir . DIRECTORY_SEPARATOR . $identifier . '.txt';
    $current_time = time();
    
    // Сохраняем время последней отправки в файл
    if (!is_dir($rate_limit_dir)) {
        mkdir($rate_limit_dir, 0755, true);
    }
    
    if (file_put_contents($rate_limit_file, $current_time, LOCK_EX) === false) {
        error_log("Failed to write rate limit file: " . $rate_limit_file);
    } else {
        error_log("Rate limit file updated: " . $rate_limit_file . " with time: " . $current_time);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Обращение успешно отправлено'
    ], JSON_UNESCAPED_UNICODE);
} else {
    $errorMsg = str_replace('ERROR: ', '', $outputStr);
    if (empty($errorMsg)) {
        $errorMsg = 'Ошибка отправки в Telegram';
    }
    http_response_code(500);
    echo json_encode(['error' => $errorMsg], JSON_UNESCAPED_UNICODE);
}
?>

