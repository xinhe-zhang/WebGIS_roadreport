<?php
header('Content-Type: application/json');


//老師的資料庫
$host = 'db.sgis.tw';
$dbname = 'traffic';
$username = 'traffic2024';
$password = 'xxxxx'; # replace this with real pswd
$port = 3306;

try {
    // 建立 PDO 連線
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // 取得表單資料
        $roadType = $_POST['road-type'] ?? null;
        $eventType = $_POST['event-type'] ?? null;
        $happendate = $_POST['happendate'] ?? null;
        $happentime = $_POST['happentime'] ?? null;
        $road = $_POST['road'] ?? null;
        $description = $_POST['description'] ?? null;
        $latitude = $_POST['latitude'] ?? null;
        $longitude = $_POST['longitude'] ?? null;

        $missingFields = [];
        if (!$roadType) $missingFields[] = 'road-type';
        if (!$eventType) $missingFields[] = 'event-type';
        if (!$happendate) $missingFields[] = 'happendate';
        if (!$happentime) $missingFields[] = 'happentime';
        if (!$road) $missingFields[] = 'road';
        if (!$description) $missingFields[] = 'description';
        if (!$latitude) $missingFields[] = 'latitude';
        if (!$longitude) $missingFields[] = 'longitude';

        // 如果有缺少的欄位，將資料傳給前端
        if (!empty($missingFields)) {
            // 傳回錯誤訊息及缺少的欄位
            echo json_encode([
                'success' => false,
                'message' => '缺少必要的欄位！',
                'missing_fields' => $missingFields
            ]);
            exit;
        }

        // 其他邏輯 (略) ...
        echo json_encode(['success' => true, 'message' => '資料提交成功！']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => '資料庫錯誤: ' . $e->getMessage()]);
}
?>
