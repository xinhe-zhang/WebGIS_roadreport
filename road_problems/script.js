document.addEventListener("DOMContentLoaded", function () {

    // Drop-zone 上傳圖片區功能
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('image');

    const removeButton = document.createElement('span');
    removeButton.innerHTML = "&#x2716;";
    removeButton.style.cssText = "position:absolute; top:5px; right:10px; cursor:pointer; color:red; font-size:16px; display:none;";
    dropZone.style.position = "relative";
    dropZone.appendChild(removeButton);

    // 預設提示文字
    const defaultText = "拖曳檔案到此區塊或點擊以上傳";
    dropZone.innerHTML = defaultText;
    dropZone.appendChild(removeButton);

    // 點擊上傳
    dropZone.addEventListener('click', () => fileInput.click());

    // 拖曳上傳
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();  // 阻止預設行為
        dropZone.style.border = "2px dashed #666";  // 拖曳時改變邊框
        dropZone.style.background = "#ffed49";  // 拖曳時改變背景
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.border = "2px dashed #ccc;";  // 拖離時恢復邊框
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();  // 防止圖片在新分頁中打開
        dropZone.style.border = "2px dashed #ccc";  // 拖曳完成恢復邊框
        
        const files = e.dataTransfer.files;

        if (files.length > 0) {
            fileInput.files = files;  // 將拖曳的檔案設定給 file input
            
            // 手動觸發 input change 事件，讓表單知道檔案已更改
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });

    // 確保透過 file input 選擇檔案也會觸發處理邏輯
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;

            // 清空 dropZone 並保持提示文字存在
            dropZone.innerHTML = "";

            // 新增檔案名稱顯示
            const fileNameText = document.createElement('p');
            fileNameText.style.color = "#0f5132";
            fileNameText.textContent = `已選擇檔案：${fileName}`;

            // 加入新內容並顯示移除按鈕
            dropZone.appendChild(fileNameText);
            dropZone.appendChild(removeButton);
            removeButton.style.display = "block";
        }
    });

    // 移除按鈕點擊事件
    removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = "";  // 清空 input

        // 清空 dropZone 並恢復預設提示文字
        dropZone.innerHTML = defaultText;
        dropZone.appendChild(removeButton);
        removeButton.style.display = "none";
    });

    // 接收來自主頁的經緯度與道路名稱
    window.addEventListener('message', function (event) {
        const data = event.data;

        console.log("接收到的資料:", data); // 檢查完整的傳送資料

        if (data.lat && data.lng && data.roadName) {
            // 填入表單欄位
            document.getElementById('latitude').value = data.lat;   // 更新為 data.lat
            document.getElementById('longitude').value = data.lng; // 更新為 data.lng
            window.roadName = data.roadName; // 儲存到全域變數

            // 檢查填入的經緯度值
            console.log("填入的經緯度:");
            console.log("Latitude:", document.getElementById('latitude')?.value);
            console.log("Longitude:", document.getElementById('longitude')?.value);
            console.log("Road Name:", window.roadName);

            // 更新 <p> 的內容
            const locationAlert = document.getElementById('location-select-alert');
            if (locationAlert) {
                locationAlert.textContent = "✅You have selected a location!";
                locationAlert.style.color = "green"; // 可選：更改文字顏色為綠色
            }
        } else {
            console.error("缺少必要的資料:", data);

            // 如果經緯度無法填入，還原警告內容
            const locationAlert = document.getElementById('location-select-alert');
            if (locationAlert) {
                locationAlert.textContent = "You haven't selected a location.";
                locationAlert.style.color = "red"; // 可選：更改文字顏色為紅色
            }
        }
    });

    // 提交資料到後端
    const submitButton = document.getElementById('submit-button');

    if (!submitButton) {
        console.error("找不到 submit-button 按鈕！");
        return;
    }

    submitButton.addEventListener('click', async (e) => {
        e.preventDefault(); // 停止預設表單提交行為

        try {
            // 獲取所有必要欄位的值
            const roadType = document.getElementById('road-type')?.value || "";
            const eventType = document.getElementById('event-type')?.value || "";
            const datetimeValue = document.getElementById('happendatetime')?.value || "";
            const description = document.getElementById('description')?.value || "";
            const latitude = document.getElementById('latitude')?.value || "";
            const longitude = document.getElementById('longitude')?.value || "";

            let roadName = window.roadName || "未知地點"; // 確保 roadName 存在

            if (!roadType || !eventType || !datetimeValue || !description || !latitude || !longitude || !roadName) {
                alert("請填寫所有必填欄位！");
                return;
            }

            // 準備 FormData
            const formData = new FormData();
            formData.append('road-type', roadType);
            formData.append('event-type', eventType);
            formData.append('happendate', datetimeValue.split('T')[0]);
            formData.append('happentime', datetimeValue.split('T')[1]);
            formData.append('road', roadName);
            formData.append('description', description);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);

            // 圖片處理
            if (fileInput && fileInput.files.length > 0) {
                formData.append('image', fileInput.files[0]);
            }

            console.log("準備發送的資料:", Object.fromEntries(formData.entries())); // 偵錯用，印出發送的資料

            // 發送請求至後端
            const response = await fetch('submit_report.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
            }

            let data;
            try {
                data = await response.json();
            } catch {
                throw new Error("後端回傳格式錯誤，非 JSON 格式！");
            }

            console.log("伺服器回應:", data);

            // 檢查後端回傳的結果
            if (data.success) {
                alert("資料提交成功！");
                console.log("資料成功插入資料庫！");

                // 傳送訊息給 mainpage，請求刷新
                window.parent.postMessage('refresh-mainpage', '*');

                // 自動刷新 iframe 本身
                window.location.reload(true);
            } else {
                if (data.missing_fields) {
                    console.error("缺少的欄位:", data.missing_fields); // 顯示缺少的欄位到 Console
                    alert(`提交失敗: 缺少以下欄位: ${data.missing_fields.join(', ')}`);
                } else {
                    console.error("資料提交失敗，伺服器回應:", data.message);
                    alert(`提交失敗: ${data.message || "未知錯誤"}`);
                }
            }
        } catch (error) {
            console.error("提交錯誤:", error);
            alert(`發生錯誤: ${error.message}`);
        }
    });
});
