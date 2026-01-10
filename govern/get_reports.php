<?php
header('Content-Type: application/json');

//電腦內部資料庫
//$host = 'localhost';
//$dbname = 'road';
//$username = 'root';
//$password = 'Sherry0518';
//$port = 3306;

//老師的資料庫
$host = 'db.sgis.tw';
$dbname = 'traffic';
$username = 'traffic2024';
$password = 'webgisisfun';
$port = 3306;

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 檢查是否有傳入篩選條件
    $eventType = $_GET['event-type'] ?? null;

    if ($eventType && $eventType !== '全部') {
        // 根據災害類型篩選
        $stmt = $pdo->prepare("SELECT * FROM reports WHERE event_type = :event_type");
        $stmt->execute([':event_type' => $eventType]);
    } else {
        // 查詢所有資料
        $stmt = $pdo->query("SELECT * FROM reports");
    }

    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reports);
} catch (PDOException $e) {
    echo json_encode(['error' => '資料庫錯誤：' . $e->getMessage()]);
}
?>
