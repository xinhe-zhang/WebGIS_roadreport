document.addEventListener("DOMContentLoaded", function () {

    

    // Initialize Map with Leaflet 初始化地圖位置和縮放
    const map = L.map('map').setView([25.0478, 121.5186], 13); // Taipei Main Station

    // Base Tile Layers 三個底圖
    const baseMaps = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map), // 預設為 OpenStreetMap
        "Google Map": L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            attribution: '© Google Maps'
        }),
        "Satellite": L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            attribution: '© Google Satellite'
        })
    };

    // 當前底圖的引用
    let currentBaseLayer = baseMaps["OpenStreetMap"]; // 預設為 OpenStreetMap

    // Add Layer Control 控制圖層切換
    L.control.layers(baseMaps).addTo(map);



    // Marker Configuration 定義座標圖示
    const customIcon = L.icon({
        iconUrl: './images/custom_marker.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const defaultIcon = L.icon({
        iconUrl: './images/default_marker.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const CMSIcon = L.icon({
        iconUrl: './images/information.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const defaultIconCheck = L.icon({
        iconUrl: './images/default_marker_check.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const icons = {
        "道路施工": L.icon({ iconUrl: './images/construction (1).png', iconSize: [32, 32], iconAnchor: [16, 32] }),
        "交通管制": L.icon({ iconUrl: './images/closedroad.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
        "事故": L.icon({ iconUrl: './images/caraccident.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
        "災變": L.icon({ iconUrl: './images/fallingrocks.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
        "其他": L.icon({ iconUrl: './images/caution.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
        "阻塞": L.icon({ iconUrl: './images/velocimeter.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
        "號誌故障": L.icon({ iconUrl: './images/trafficlight.png', iconSize: [32, 32], iconAnchor: [16, 32] })
    };

    // 初始化使用者座標
    let userMarker;
    let lastCoordinates = null;
    let roadName = "未知地點";

    const coordinateBox = document.getElementById('coordinate-box');

    // Function to send data to iframe
    const iframe = document.getElementById('report-iframe');
    function updateIframeData(lat, lon, road) {
        const data = { latitude: lat, longitude: lon, roadName: road };
        iframe.contentWindow.postMessage(data, '*');
    }

    // Update marker and coordinates
    function updateCoordinates(lat, lon) {
        if (userMarker) map.removeLayer(userMarker);

        userMarker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

        coordinateBox.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
        lastCoordinates = { lat: lat.toFixed(6), lon: lon.toFixed(6) };
    }

    // Map Click Event
    map.on('click', function (e) {
        const { lat, lng } = e.latlng;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(res => res.json())
            .then(data => {
                const roadName = data.address?.road || "未知地點";
                updateCoordinates(lat, lng);
                updateIframeData(lat.toFixed(6), lng.toFixed(6), roadName); // 傳送資料到 iframe
            });
    });

    // Geolocation Button
    document.getElementById('getLocation').addEventListener('click', function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    const { latitude, longitude } = position.coords;

                    // 更新地圖與座標
                    updateCoordinates(latitude, longitude);
                    map.setView([latitude, longitude], 16);

                    // 使用 Nominatim 反向地理定位獲取道路名稱
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                        .then(res => res.json())
                        .then(data => {
                            const roadName = data.address?.road || "未知地點"; // 提取道路名稱
                            updateIframeData(latitude.toFixed(6), longitude.toFixed(6), roadName); // 傳送資料到 iframe
                        })
                        .catch(err => {
                            console.error("反向地理定位失敗:", err);
                            updateIframeData(latitude.toFixed(6), longitude.toFixed(6), "未知地點"); // 如果失敗，使用預設值
                        });
                },
                function (error) {
                    alert('Unable to retrieve location: ' + error.message); // 地理定位錯誤處理
                }
            );
        } else {
            alert("Geolocation is not supported by this browser."); // 瀏覽器不支援地理定位
        }
    });



    // Search Address
    // 定義反向地理定位函式 fetchRoadName
    function fetchRoadName(lat, lon) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=zh-TW`;
    
        return fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data.status === 'OK' && data.results.length > 0) {
                    const addressComponents = data.results[0].address_components;
                    const roadComponent = addressComponents.find(component =>
                        component.types.includes('route')
                    );
                    return roadComponent ? roadComponent.long_name : "未知地點";
                } else {
                    console.error("反向地理定位失敗，結果:", data);
                    return "未知地點";
                }
            })
            .catch(error => {
                console.error("反向地理定位請求失敗:", error);
                return "未知地點";
            });
    }
    

    // 搜尋按鈕事件處理程式
    $('#search-btn').on('click', function () {
        const address = $('#search-address').val();
        if (address) {
            $.ajax({
                url: `https://nominatim.openstreetmap.org/search?format=json&q=${address}`,
                success: function (data) {
                    if (data.length > 0) {
                        const { lat, lon } = data[0];
                        updateCoordinates(parseFloat(lat), parseFloat(lon));
                        map.setView([parseFloat(lat), parseFloat(lon)], 16);
    
                        // 使用 Nominatim 反向地理定位獲取道路名稱
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                            .then(res => res.json())
                            .then(reverseData => {
                                const roadName = reverseData.address?.road || "未知地點";
                                updateIframeData(lat.toFixed(6), lon.toFixed(6), roadName); // 傳送資料到 iframe
                            })
                            .catch(err => {
                                console.error("反向地理定位失敗:", err);
                                updateIframeData(lat.toFixed(6), lon.toFixed(6), "未知地點");
                            });
                    } else {
                        alert('Address not found!');
                    }
                },
                error: function (xhr, status, error) {
                    console.error("搜尋地址時出錯:", error);
                    alert('無法處理您的請求，請稍後再試！');
                }
            });
        } else {
            alert('請輸入有效的地址！');
        }
    });

    // 取得 Access Token
    async function getAccessToken() {
        const clientID = 'linsiaoshu-18230330-7a43-4c19';
        const clientSecret = '6474f8d1-206b-4b9c-9e97-35e924a695bc';
        const auth_url = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';

        try {
            const response = await fetch(auth_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: clientID,
                    client_secret: clientSecret,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                return data.access_token;
            } else {
                console.error('取得 Access Token 失敗:', data);
                return null;
            }
        } catch (error) {
            console.error('Access Token 請求失敗:', error);
            return null;
        }
    }

    // 取得CMS位置資料
    async function fetchCMSData(city) {
        const accesstoken = await getAccessToken();

        if (!accesstoken) {
            console.error('無法取得 Access Token，無法載入CMS資料');
            return [];
        }

        const cmsurl = `https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/CMS/City/${city}?$format=JSON`;
        try {
            const response = await fetch(cmsurl, {
                method:'GET',
                headers:{
                    Authorization: `Bearer ${accesstoken}`,
                },
            });
            if (response.ok){
                const cmsdata = await response.json();
                if (cmsdata && cmsdata.CMSs) {
                    return cmsdata.CMSs;
                } else {
                    return[];
                }
            } else {
                console.error(`CMS資料請求失敗(city = ${city})，狀態碼:`, response.status);
                return [];
            } 
        } catch (error) {
            console.error(`取得 ${city} CMS 資料失敗:`, error);
            return [];
        }       
    }

    // 取得CMS即時資訊
    async function fetchCMSLiveData(city) {
        const accesstoken = await getAccessToken();

        if (!accesstoken){
            console.error('無法取得Access Token');
            return [];
        }

        const cmsliveurl = `https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/Live/CMS/City/${city}?%24format=JSON`;
        try {
            const response = await fetch(cmsliveurl,{
                method:'GET',
                headers:{
                    Authorization: `Bearer ${accesstoken}`,
                },
            });
            if (response.ok) {
                const cmslivedata = await response.json();
                if (cmslivedata && cmslivedata.CMSLives) {
                    // 特別處理宜蘭縣的CMSID格式
                    if (city === "YilanCounty"){
                        cmslivedata.CMSLives.forEach(cmsLive => {
                            if (cmsLive.CMSID.startsWith("ILA:CMS:")){
                                cmsLive.CMSID = cmsLive.CMSID.replace("ILA:CMS:", "");
                            }
                        });
                    }
                    return cmslivedata.CMSLives;
                } else {
                    console.warn(`CMS 即時資訊為空 (city = ${city})`);
                    return [];
                }
            } else {
                console.error(`CMS即時資料請求失敗(city = ${city})，狀態碼:`, response.status);
                return [];
            }
        } catch (error) {
            console.error(`取得 ${city} CMS 即時資訊失敗:`, error);
            return [];
        }
    }

    // 儲存當前地圖上的CMS Marker
    let cmsMarkers = [];
    // 清除所有CMS Marker 
    function clearCMSMarkers() {
        cmsMarkers.forEach(marker => {
            map.removeLayer(marker);
        });
        cmsMarkers = []; //重置陣列
    }

    //顯示CMS資料
    async function updateCMSData(){
        const citySelect = document.getElementById('city-select');
        const selectedCity = citySelect.value;

        if (!selectedCity) {
            console.log('尚未選擇縣市，不顯示任何 CMS 資料');
            clearCMSMarkers();
            return;
        }
        clearCMSMarkers();

        const cmsdata = await fetchCMSData(selectedCity);
        const cmslivedata = await fetchCMSLiveData(selectedCity);

        if (cmsdata.length === 0 || cmslivedata.length === 0) {
            console.warn(`CMS 資料或即時資訊為空 (${selectedCity})`);
            return;
        }

        const cmsLiveMap = new Map();
        cmslivedata.forEach(cmsLive => {
            cmsLiveMap.set(cmsLive.CMSID, cmsLive);
        });

        cmsdata.forEach(cms => {
            const livedata = cmsLiveMap.get(cms.CMSID);
            if(!livedata) return;

            let message = '無資訊';
            let time = '未知';
            if (livedata.MessageStatus === 1 && livedata.Messages?.length >0) {
                message = livedata.Messages.map(msg => msg.Text).join('<br>');
            }
            if (livedata.DataCollectTime) {
                time = livedata.DataCollectTime;
            }

            const marker = L.marker([cms.PositionLat, cms.PositionLon], {icon: CMSIcon})
                .addTo(map).bindPopup(`
                <b>CMSID：</b>${cms.CMSID || "未知"}<br>
                <b>道路名稱：</b>${cms.RoadName || "未知"}<br>
                <b>即時資訊：</b>${message}<br>
                <b>資料時間：</b>${time}<br>
                `);
            cmsMarkers.push(marker);
        });

    }
    //監聽下拉選單變化
    const citySelect = document.getElementById('city-select');
    citySelect.addEventListener('change', updateCMSData);
    

    // 選取所有 checkbox
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    // 用於顯示開放資料點位的函數
    function showFilteredData() {
        // 清除地圖上的現有標記
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // 取得當前選中的 checkbox id
        const selectedTypes = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.id);

        // 取得當前的 statusFilter 值
        const statusFilterValue = document.getElementById('statusFilter').value;

        // 在控制台打印當前勾選的內容和篩選條件
        console.log('目前被勾選的類型:', selectedTypes);
        console.log('目前選擇的狀態篩選:', statusFilterValue);

        // 顯示開放資料點位
        fetch("http://localhost:3000/api/road")
            .then(res => res.json())
            .then(data => {
                data.forEach(event => {
                    if (selectedTypes.includes(event.roadtype)) {
                        L.marker([event.y1, event.x1], { icon: icons[event.roadtype] || icons["其他"] })
                            .addTo(map).bindPopup(`
                                <b>發生日期：</b>${event.happendate}</br>
                                <b>發生時間：</b>${event.happentime}<br>
                                <b>路況類型：</b>${event.roadtype}<br>
                                <b>發生地點：</b>${event.areaNm}<br>
                                <b>道路名稱：</b>${event.road}<br>
                                <b>方向：</b>${event.direction}<br>
                                <b>路況描述：</b>${event.comment}
                            `);
                    }
                });
            });

        

        // 顯示資料庫點位
    fetch("get_reports.php")
    .then(res => res.json())
    .then(data => {
        data.forEach(report => {
            const matchesType = selectedTypes.includes(report.event_type);
            const matchesStatus = !statusFilterValue || report.status === statusFilterValue;

            if (matchesType && matchesStatus) {
                // 根據狀態切換圖標
                const icon = report.status === "已處理" ? defaultIconCheck : defaultIcon;

                const marker = L.marker([report.latitude, report.longitude], { icon: icon }).addTo(map);

                // Popup 內容包含狀態修改按鈕
                const popupContent = `
                    <b>發生日期：</b>${report.happendate || "未知"}<br>
                    <b>道路名稱：</b>${report.road || "未知"}<br>
                    <b>描述：</b>${report.description || "無描述"}<br>
                    ${report.image_path ? `<img src="${report.image_path}" style="width:150px;">` : "無圖片"}<br>
                    <b>狀態：</b><span id="status-${report.id}">${report.status || "未處理"}</span><br>
                    <button class="update-status" data-id="${report.id}" data-status="已處理">標記為已處理</button>
                    <button class="update-status" data-id="${report.id}" data-status="未處理">標記為未處理</button>
                `;
                marker.bindPopup(popupContent);
            }
        });
    });
    };

    document.addEventListener("click", function (event) {
        if (event.target && event.target.classList.contains("update-status")) {
            const reportId = event.target.getAttribute("data-id");
            const newStatus = event.target.getAttribute("data-status");

            if (reportId && newStatus) {
                updateStatus(reportId, newStatus);
            }
        }
    });

    document.getElementById("statusFilter").addEventListener("change", function () {
        const selectedValue = this.value;
        localStorage.setItem("statusFilterValue", selectedValue);
        filterReports(selectedValue); // 保持現有過濾功能
    });

    document.addEventListener("DOMContentLoaded", function () {
        const statusFilter = document.getElementById("statusFilter");
        const savedValue = localStorage.getItem("statusFilterValue");
        if (savedValue) {
            statusFilter.value = savedValue;
            filterReports(savedValue); // 重新執行過濾
        }
    });




// 更新狀態的函數
function updateStatus(reportId, newStatus) {
    console.log(`嘗試更新狀態: ID=${reportId}, 新狀態=${newStatus}`);
    fetch("update_status.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: reportId, status: newStatus }),
    })
        .then(res => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error("伺服器回應錯誤");
            }
        })
        .then(data => {
            if (data.success) {
                alert("狀態更新成功！");
                // 刷新頁面
                window.location.reload();
            } else {
                throw new Error(data.message || "狀態更新失敗！");
            }
        })
        .catch(err => {
            console.error("更新狀態失敗:", err);
            alert(`更新失敗: ${err.message}`);
        });
}



    // 為每個 checkbox 添加事件監聽器
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', showFilteredData); // 監聽變更事件
    });

    // 為 statusFilter 添加事件監聽器
    document.getElementById('statusFilter').addEventListener('change', showFilteredData);

    // 頁面加載時初始化顯示
    window.addEventListener('DOMContentLoaded', showFilteredData);


    // Google Maps Autocomplete 地址自動填寫
    const searchInput = document.getElementById('search-address');
    const autocomplete = new google.maps.places.Autocomplete(searchInput);

    autocomplete.addListener('place_changed', function () {
        const place = autocomplete.getPlace();
        if (!place.geometry) return alert("找不到該地點，請重新輸入！");

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // 更新地圖座標與標記
        updateCoordinates(lat, lng);
        map.setView([lat, lng], 16);
    });

    // Toggle Report Event Sidebar 事件回報視窗彈出與收回
    document.getElementById('report-btn').addEventListener('click', function () {
        const reportPage = document.getElementById('report-page');
        const iframe = document.getElementById('report-iframe');
        const isSidebarVisible = reportPage.style.display === 'block';

        if (isSidebarVisible) {
            reportPage.style.display = 'none';
            iframe.src = ''; // 清空 iframe
        } else {
            reportPage.style.display = 'block';
            iframe.src = '../road_problems'; // 加載內容
            iframe.addEventListener('load', function () {
                // 在 iframe 加載完成後傳送資料
                if (lastCoordinates && roadName) {
                    updateIframeData(lastCoordinates.lat, lastCoordinates.lon, roadName);
                }
            }, { once: true });
        }
    });

    // Handle "Close" button in the sidebar
    document.getElementById('close-report').addEventListener('click', function () {
        const sidebar = document.getElementById('report-page');
        sidebar.style.display = 'none';
    });

    // 監聽 iframe 傳來的消息，若為 "refresh" 則刷新 mainpage
    window.addEventListener('message', function (event) {
        if (event.data === 'refresh-mainpage') {
            console.log('接收到 iframe 請求，刷新 mainpage');
            window.location.reload(true); // 強制刷新 mainpage
        }
    });


});
