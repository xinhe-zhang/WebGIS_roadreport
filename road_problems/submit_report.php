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
        // 取得表單資料
        $roadType = $_POST['road-type'] ?? null;
        $eventType = $_POST['event-type'] ?? null;
        $happendate = $_POST['happendate'] ?? null;
        $happentime = $_POST['happentime'] ?? null;
        $road = $_POST['road'] ?? null;
        $description = $_POST['description'] ?? null;
        $latitude = $_POST['latitude'] ?? null;
        $longitude = $_POST['longitude'] ?? null;
        $region = "N";
        $modDttm = date('Y-m-d H:i:s');
        $imagePath = null;

        // 新增 status 欄位，預設為 "未處理"
        $status = '未處理';

        // 檢查缺少的欄位
        $missingFields = [];
        if (!$roadType) $missingFields[] = 'road-type';
        if (!$eventType) $missingFields[] = 'event-type';
        if (!$happendate) $missingFields[] = 'happendate';
        if (!$happentime) $missingFields[] = 'happentime';
        if (!$road) $missingFields[] = 'road';
        if (!$description) $missingFields[] = 'description';
        if (!$latitude) $missingFields[] = 'latitude';
        if (!$longitude) $missingFields[] = 'longitude';

        // 如果有缺少的欄位
        if (!empty($missingFields)) {
            echo json_encode([
                'success' => false,
                'message' => '缺少必要的欄位！',
                'missing_fields' => $missingFields
            ]);
            exit;
        }

        // 處理圖片上傳（存到 mainpage 根目錄的 uploads 資料夾）
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../mainpage/uploads/'; // 回到 mainpage 根目錄
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // 生成唯一檔名
            $imageName = uniqid() . '_' . basename($_FILES['image']['name']);
            $targetPath = $uploadDir . $imageName;

            // 移動檔案到指定路徑
            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                $imagePath = 'uploads/' . $imageName; // 儲存相對路徑到資料庫
            } else {
                echo json_encode(['success' => false, 'message' => '圖片上傳失敗']);
                exit;
            }
        }

        // SQL 插入資料
        $stmt = $pdo->prepare("
            INSERT INTO reports (
                road_type, event_type, happendate, happentime, road, description,
                region, latitude, longitude, modDttm, image_path, status, created_at
            ) VALUES (
                :road_type, :event_type, :happendate, :happentime, :road, :description,
                :region, :latitude, :longitude, :modDttm, :image_path, :status, NOW()
            )
        ");

        // 綁定參數
        $stmt->execute([
            ':road_type' => $roadType,
            ':event_type' => $eventType,
            ':happendate' => $happendate,
            ':happentime' => $happentime,
            ':road' => $road,
            ':description' => $description,
            ':region' => $region,
            ':latitude' => $latitude,
            ':longitude' => $longitude,
            ':modDttm' => $modDttm,
            ':image_path' => $imagePath,
            ':status' => $status // 綁定 status 欄位
        ]);

        // 驗證插入結果
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => '資料提交成功！',
                'uploaded_image' => $imagePath ?? '無圖片'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => '資料未成功插入資料庫！'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => '無效的請求方法！'
        ]);
    }
} catch (PDOException $e) {
    // 錯誤日誌記錄
    error_log("SQL 錯誤: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => '資料庫錯誤: ' . $e->getMessage()
    ]);
}
?>
