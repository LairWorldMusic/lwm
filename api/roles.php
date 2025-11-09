<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Определяем корень проекта (на два уровня выше от site/api/)
function getProjectRoot() {
    return dirname(dirname(__DIR__));
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database path (относительно корня проекта)
$project_root = getProjectRoot();
$dbPath = $project_root . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'users.db';

function normalizeRole($role) {
    if (!$role) return 'OTHER';
    $r = mb_strtoupper(trim($role), 'UTF-8');
    
    // Русские роли из вашей базы
    if ($r === 'МУЗЫКАЛЬНЫЙ ПРОДЮСЕР' || str_contains($r, 'ПРОДЮСЕР')) return 'PRODUCERS';
    if ($r === 'СПЕЦИАЛИСТ ОНЛАЙН-КОММУНИКАЦИЙ' || str_contains($r, 'КОММУНИКАЦИ')) return 'SMM';
    if (str_contains($r, 'ДИЗАЙН') && !str_contains($r, 'MOTION')) return 'DESIGN';
    if ($r === 'ЭКСКЛЮЗИВНЫЙ ДИСТРИБЬЮТОР' || str_contains($r, 'ДИСТРИБЬЮТОР')) return 'DISTRIBUTORS';
    if ($r === 'МЕНЕДЖЕР') return 'DISTRIBUTORS';
    
    // Английские роли (на случай если будут)
    if (str_starts_with($r, 'PRODUCER')) return 'PRODUCERS';
    if ($r === 'SMM' || str_contains($r, 'SMM')) return 'SMM';
    if (str_starts_with($r, 'MOTION')) return 'MOTION-DESIGN';
    if (str_contains($r, 'DESIGN') && !str_starts_with($r, 'MOTION')) return 'DESIGN';
    if (str_starts_with($r, 'DISTR') || str_contains($r, 'DIST')) return 'DISTRIBUTORS';
    if (str_starts_with($r, 'EDIT')) return 'EDITOR';
    
    return 'OTHER';
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $db = new PDO('sqlite:' . $dbPath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $db->query('SELECT orden FROM users');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $counts = [];
        foreach ($rows as $row) {
            $key = normalizeRole($row['orden']);
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }
        
        $total = array_sum($counts) ?: 1;
        $wanted = ['PRODUCERS', 'SMM', 'MOTION-DESIGN', 'DESIGN', 'DISTRIBUTORS', 'EDITOR'];
        
        $data = [];
        foreach ($wanted as $label) {
            $count = $counts[$label] ?? 0;
            $data[] = [
                'label' => $label,
                'count' => $count,
                'percent' => round(($count / $total) * 100)
            ];
        }
        
        echo json_encode([
            'total' => $total,
            'roles' => $data
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Ошибка сервера'], JSON_UNESCAPED_UNICODE);
        error_log('Database error: ' . $e->getMessage());
    }
    
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
}

