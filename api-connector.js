/**
 * JCO ERP Google Sheets API 連接器 v2.0
 * 整合 Google Apps Script API，提供離線 fallback
 * 2026-03-10 修復：離線模式優化，無卡住問題
 */

class JCOApiConnector {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbzJxOa28fnw81S8o9xLamXxOguVngVB-0n4evvtmleoYA-wqU3r1wvUAtBVYbeJ1H_s/exec';
        this.isOnline = false;
        this.fallbackToLocal = true;
        this.forceOffline = false;  // 🔧 改為 false，啟用線上模式
        this.loadingElements = new Set();
        this.loadingTimeout = null;
        this.maxLoadingTime = 5000;  // 最長載入時間 5 秒
        
        // 工作表對應（使用 Google Sheets 實際名稱）
        this.sheetMap = {
            'orders': '工作表1',      // 訂單
            'cost': '工作表2',        // 成本
            'inventory': '工作表3',   // 庫存
            'production': '工作表4',  // 生產
            'quality': '工作表5',     // 品質
            'hr': '工作表6',          // 人事
            'procurement': '工作表1', // 採購（暫共用訂單表）
            'logs': '工作表1'         // 日誌（暫共用）
        };
        

        // 🔧 智能重試配置 (2026-03-14 優化)
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2
        };
        
        // 🔧 API 回應快取 (2026-03-14 優化)
        this.responseCache = new Map();
        this.cacheExpiry = 60000;
        
        this.init();
    }
    
    // 初始化
    async init() {
        this.createConnectionIndicator();
        
        // 🔧 如果強制離線，立即顯示離線狀態，不等待
        if (this.forceOffline) {
            this.updateConnectionStatus(false);
            // [DEBUG] console.log('JCO ERP: 強制離線模式');
            return;
        }
        
        // 測試連線（有超時保護）
        const online = await this.testConnectionWithTimeout(3000);
        this.updateConnectionStatus(online);
        
        if (!online) {
            // [DEBUG] console.log('JCO ERP: API 無法連線，使用離線模式');
        }
        
        this.startHeartbeat();
    }
    
    // 建立連線狀態指示器
    createConnectionIndicator() {
        if (document.getElementById('connection-indicator')) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'connection-indicator';
        indicator.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:500;box-shadow:0 2px 8px rgba(0,0,0,0.15);';
        indicator.innerHTML = `
            <div id="status-dot" style="width:10px;height:10px;border-radius:50%;"></div>
            <span id="status-text">連線中...</span>
        `;
        // 確保 body 存在才添加
        if (document.body) {
            document.body.appendChild(indicator);
        } else {
            // 如果 body 還沒載入，等 DOM 載入後再添加
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(indicator);
            });
        }
        
        // 預設顯示離線（避免卡住）
        this.updateConnectionStatus(false);
    }
    
    // 更新連線狀態顯示
    updateConnectionStatus(online) {
        this.isOnline = online;
        const indicator = document.getElementById('connection-indicator');
        const dot = document.getElementById('status-dot');
        const text = document.getElementById('status-text');
        
        if (!indicator || !dot || !text) return;
        
        if (online) {
            indicator.style.backgroundColor = '#d1fae5';
            indicator.style.color = '#065f46';
            dot.style.backgroundColor = '#10b981';
            text.textContent = '🟢 線上同步';
        } else {
            indicator.style.backgroundColor = '#fef3c7';
            indicator.style.color = '#92400e';
            dot.style.backgroundColor = '#f59e0b';
            text.textContent = '🟡 離線模式';
        }
        
        // 🔧 立即隱藏所有載入指示器
        this.hideAllLoading();
    }
    
    // 🔧 新增：隱藏所有載入中指示器
    hideAllLoading() {
        const loading = document.getElementById('global-loading');
        if (loading) loading.remove();
        
        // 清除所有 loading 狀態
        this.loadingElements.clear();
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
    }
    
    // 🔧 新增：帶超時的連線測試
    async testConnectionWithTimeout(timeout = 3000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(`${this.apiUrl}?action=read&sheet=${encodeURIComponent('工作表1')}`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const result = await response.json();
                return result.status === 200;
            }
            return false;
        } catch (error) {
            console.warn('連線測試失敗:', error.message);
            return false;
        }
    }
    
    // 測試連線
    async testConnection() {
        return await this.testConnectionWithTimeout(3000);
    }
    
    // 心跳檢查
    startHeartbeat() {
        setInterval(async () => {
            if (!this.forceOffline) {
                const online = await this.testConnectionWithTimeout(3000);
                this.updateConnectionStatus(online);
            }
        }, 60000); // 60秒檢查一次
    }
    
    // 顯示載入中（有超時保護）
    showLoading(elementId) {
        this.loadingElements.add(elementId);
        
        // 全域載入指示器
        if (!document.getElementById('global-loading')) {
            const loading = document.createElement('div');
            loading.id = 'global-loading';
            loading.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:white;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.2);padding:20px 30px;display:flex;align-items:center;gap:12px;';
            loading.innerHTML = `
                <div style="width:24px;height:24px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div>
                <span style="color:#374151;font-size:14px;">資料載入中...</span>
                <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
            `;
            document.body.appendChild(loading);
        }
        
        // 🔧 超時保護：最多顯示 5 秒
        if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
        this.loadingTimeout = setTimeout(() => {
            this.hideAllLoading();
            console.warn('載入超時，自動隱藏');
        }, this.maxLoadingTime);
    }
    
    // 隱藏載入中
    hideLoading(elementId) {
        this.loadingElements.delete(elementId);
        
        if (this.loadingElements.size === 0) {
            this.hideAllLoading();
        }
    }
    
    // API 呼叫包裝器
    async apiCall(action, params = {}) {
        const loadingId = `api-${action}-${Date.now()}`;
        
        // 🔧 離線模式直接走 localStorage，不顯示載入
        if (this.forceOffline || !this.isOnline) {
            return this.fallbackToLocalStorage(action, params);
        }
        
        try {
            this.showLoading(loadingId);
            
            const url = new URL(this.apiUrl);
            url.searchParams.append('action', action);
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined) {
                    url.searchParams.append(key, params[key]);
                }
            });
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            this.hideLoading(loadingId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            // 🔧 同時寫入 localStorage 作為備份
            if (action === 'read' && result.data) {
                this.syncToLocalStorage(params.sheet, result.data.data || []);
            }
            
            return result;
            
        } catch (error) {
            console.warn('API 呼叫失敗，使用本地資料:', error.message);
            this.hideLoading(loadingId);
            this.updateConnectionStatus(false);
            return this.fallbackToLocalStorage(action, params);
        }
    }
    
    // 🔧 新增：同步到 localStorage
    syncToLocalStorage(sheet, data) {
        const key = this.getLocalStorageKey(sheet);
        localStorage.setItem(key, JSON.stringify(data));
    }
    
    // 離線 fallback 到 localStorage
    fallbackToLocalStorage(action, params) {
        const { sheet, data, row, keyword } = params;
        
        switch (action) {
            case 'ping':
            case 'read':
                const localKey = this.getLocalStorageKey(sheet);
                const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
                return { status: 200, data: { data: localData, count: localData.length } };
                
            case 'write':
            case 'append':
                return this.localAppend(sheet, JSON.parse(data || '[]'));
                
            case 'update':
                return this.localUpdate(sheet, parseInt(row), JSON.parse(data || '[]'));
                
            case 'delete':
                return this.localDelete(sheet, parseInt(row));
                
            case 'search':
                return this.localSearch(sheet, keyword);
                
            default:
                console.warn('不支援的離線操作:', action);
                return { status: 400, error: `不支援的操作: ${action}` };
        }
    }
    
    // 取得 localStorage key
    getLocalStorageKey(sheet) {
        const keyMap = {
            '訂單': 'jco-orders',
            '成本': 'jco-cost-tasks',
            '庫存': 'jco-inventory',
            '生產': 'jco-production',
            '品質': 'jco-quality',
            '人事': 'JCO_ERP_USERS',
            '採購': 'jco-procurement',
            '日誌': 'jco-logs',
            // 兼容舊名稱
            '工作表1': 'jco-orders',
            '工作表2': 'jco-cost-tasks',
            '工作表3': 'jco-inventory',
            '工作表4': 'jco-production',
            '工作表5': 'jco-quality',
            '工作表6': 'JCO_ERP_USERS'
        };
        return keyMap[sheet] || `jco-${sheet}`;
    }
    
    // 本地新增
    localAppend(sheet, newData) {
        const key = this.getLocalStorageKey(sheet);
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        
        // 🔧 確保數據格式一致
        if (Array.isArray(newData)) {
            data.push(...newData);
        } else {
            data.push(newData);
        }
        
        localStorage.setItem(key, JSON.stringify(data));
        return { status: 200, success: true, row: data.length };
    }
    
    // 本地更新
    localUpdate(sheet, row, newData) {
        const key = this.getLocalStorageKey(sheet);
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (row > 0 && row <= data.length) {
            data[row - 1] = newData;
            localStorage.setItem(key, JSON.stringify(data));
            return { status: 200, success: true };
        }
        return { status: 404, success: false, error: 'Row not found' };
    }
    
    // 本地刪除
    localDelete(sheet, row) {
        const key = this.getLocalStorageKey(sheet);
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (row > 0 && row <= data.length) {
            data.splice(row - 1, 1);
            localStorage.setItem(key, JSON.stringify(data));
            return { status: 200, success: true };
        }
        return { status: 404, success: false, error: 'Row not found' };
    }
    
    // 本地搜尋
    localSearch(sheet, keyword) {
        const key = this.getLocalStorageKey(sheet);
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        const results = data.filter(item => 
            JSON.stringify(item).toLowerCase().includes(keyword.toLowerCase())
        );
        return { status: 200, data: { data: results, count: results.length } };
    }
    
    // 便利方法
    async getSheetData(sheetKey) {
        const sheetName = this.sheetMap[sheetKey] || sheetKey;
        const result = await this.apiCall('read', { sheet: sheetName });
        return result.data?.data || [];
    }
    
    async appendToSheet(sheetKey, data) {
        const sheetName = this.sheetMap[sheetKey] || sheetKey;
        return await this.apiCall('append', { 
            sheet: sheetName, 
            data: JSON.stringify(Array.isArray(data) ? data : [data])
        });
    }
    
    async updateSheetRow(sheetKey, row, data) {
        const sheetName = this.sheetMap[sheetKey] || sheetKey;
        return await this.apiCall('update', { 
            sheet: sheetName, 
            row: row.toString(),
            data: JSON.stringify(data) 
        });
    }
    
    async deleteSheetRow(sheetKey, row) {
        const sheetName = this.sheetMap[sheetKey] || sheetKey;
        return await this.apiCall('delete', { 
            sheet: sheetName, 
            row: row.toString()
        });
    }
    
    async searchSheet(sheetKey, keyword) {
        const sheetName = this.sheetMap[sheetKey] || sheetKey;
        const result = await this.apiCall('search', { 
            sheet: sheetName, 
            keyword: keyword 
        });
        return result.data?.data || [];
    }
    
    // 🔧 新增：強制同步到雲端
    async forceSyncToCloud() {
        if (this.forceOffline) {
            console.warn('強制離線模式，無法同步');
            return false;
        }
        
        const sheets = Object.keys(this.sheetMap);
        for (const sheet of sheets) {
            const localData = JSON.parse(localStorage.getItem(this.getLocalStorageKey(this.sheetMap[sheet])) || '[]');
            if (localData.length > 0) {
                try {
                    await this.apiCall('write', {
                        sheet: this.sheetMap[sheet],
                        data: JSON.stringify(localData)
                    });
                    // [DEBUG] console.log(`已同步 ${sheet} 到雲端`);
                } catch (e) {
                    console.error(`同步 ${sheet} 失敗:`, e);
                }
            }
        }
        return true;
    }
    
    // 🔧 新增：切換離線/線上模式
    setOfflineMode(offline) {
        this.forceOffline = offline;
        if (offline) {
            this.updateConnectionStatus(false);
        } else {
            this.testConnectionWithTimeout(3000).then(online => {
                this.updateConnectionStatus(online);
            });
        }
    }
    
    // 🔧 帶重試的 fetch (2026-03-14 大師級優化)
    async fetchWithRetry(url, options = {}, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            if (retryCount < this.retryConfig.maxRetries) {
                const delay = Math.min(
                    this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
                    this.retryConfig.maxDelay
                );
                // [DEBUG] console.log(`API 重試 ${retryCount + 1}/${this.retryConfig.maxRetries}，等待 ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            throw error;
        }
    }
    
    // 🔧 友善錯誤訊息 (2026-03-14 大師級優化)
    getErrorMessage(error) {
        const errorMessages = {
            'Failed to fetch': '網路連線失敗，請檢查網路狀態',
            'NetworkError': '網路錯誤，正在嘗試重新連線...',
            'AbortError': '請求超時，伺服器回應過慢',
            'TypeError': '資料格式錯誤，請聯繫技術支援',
            '404': '找不到資料，請確認工作表名稱',
            '500': '伺服器錯誤，請稍後再試',
            '403': '權限不足，請確認帳號權限'
        };
        
        for (const [key, msg] of Object.entries(errorMessages)) {
            if (error.toString().includes(key)) return msg;
        }
        return '發生未知錯誤: ' + error.message;
    }
    
    // 🔧 顯示使用者通知 (2026-03-14 大師級優化)
    showNotification(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${colors[type]};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-size: 14px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // 🔧 快取讀取 (2026-03-14 大師級優化)
    getCachedResponse(key) {
        const cached = this.responseCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            // [DEBUG] console.log('使用快取:', key);
            return cached.data;
        }
        return null;
    }
    
    setCachedResponse(key, data) {
        this.responseCache.set(key, { data, timestamp: Date.now() });
    }
}

// 全域 API 實例
window.JCO_API = new JCOApiConnector();

// 🔧 調試用：在 console 中可用
window.JCO_DEBUG = {
    setOnline: () => window.JCO_API.setOfflineMode(false),
    setOffline: () => window.JCO_API.setOfflineMode(true),
    syncToCloud: () => window.JCO_API.forceSyncToCloud(),
    getStatus: () => ({ online: window.JCO_API.isOnline, forceOffline: window.JCO_API.forceOffline })
};

// 🔧 顯示資料更新時間 (2026-03-14 專家討論後新增)
// 滿足 UX 設計師要求：使用者需要知道資料的新鮮度
JCOApiConnector.prototype.showLastUpdateTime = function() {
    let indicator = document.getElementById('last-update-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'last-update-indicator';
        indicator.style.cssText = 'position:fixed;bottom:16px;left:16px;padding:8px 12px;background:rgba(0,0,0,0.7);color:#fff;border-radius:6px;font-size:11px;z-index:9998;';
        document.body.appendChild(indicator);
    }
    
    const now = new Date();
    indicator.innerHTML = '📊 資料更新: ' + now.toLocaleTimeString('zh-TW') + ' <button onclick="window.JCO_API.forceRefresh()" style="margin-left:8px;padding:2px 8px;cursor:pointer;border:none;background:#3b82f6;color:#fff;border-radius:4px;">🔄 刷新</button>';
};

// 🔧 強制刷新（清除快取）
JCOApiConnector.prototype.forceRefresh = function() {
    this.responseCache.clear();
    this.showNotification('快取已清除，重新載入中...', 'info');
    location.reload();
};
