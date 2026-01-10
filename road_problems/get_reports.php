<?php
header('Content-Type: application/json');


$host = 'db.sgis.tw';
$dbname = 'traffic';
$username = 'traffic2024';
$password = 'webgisisfun';
$port = 3306;

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT * FROM reports");
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reports);
} catch (PDOException $e) {
    echo json_encode(['error' => '資料庫錯誤：' . $e->getMessage()]);
}
?>
