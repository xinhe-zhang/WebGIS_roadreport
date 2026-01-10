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
    // 建立 PDO 連線
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // 從請求中取得 JSON 資料
        $input = json_decode(file_get_contents('php://input'), true);
        $reportId = $input['id'] ?? null;
        $newStatus = $input['status'] ?? null;

        // 檢查是否提供了必要的欄位
        if (!$reportId || !$newStatus) {
            echo json_encode([
                'success' => false,
                'message' => '缺少必要的欄位 (id 或 status)！'
            ]);
            exit;
        }

        // 更新資料庫中的狀態
        $stmt = $pdo->prepare("UPDATE reports SET status = :status WHERE id = :id");
        $stmt->bindParam(':status', $newStatus, PDO::PARAM_STR);
        $stmt->bindParam(':id', $reportId, PDO::PARAM_INT);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => '狀態更新成功！'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => '狀態更新失敗，請稍後再試！'
            ]);
        }
    } else {
        // 僅允許 POST 方法
        echo json_encode([
            'success' => false,
            'message' => '不支援的請求方法，請使用 POST！'
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => '資料庫錯誤: ' . $e->getMessage()
    ]);
}
?>
