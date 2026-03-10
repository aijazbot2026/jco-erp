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
        
        this.init();
    }
    
    // 初始化
    async init() {
        this.createConnectionIndicator();
        
        // 🔧 如果強制離線，立即顯示離線狀態，不等待
        if (this.forceOffline) {
            this.updateConnectionStatus(false);
            console.log('JCO ERP: 強制離線模式');
            return;
        }
        
        // 測試連線（有超時保護）
        const online = await this.testConnectionWithTimeout(3000);
        this.updateConnectionStatus(online);
        
        if (!online) {
            console.log('JCO ERP: API 無法連線，使用離線模式');
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
            
            const response = await fetch(`${this.apiUrl}?action=read&sheet=訂單`, {
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
                    console.log(`已同步 ${sheet} 到雲端`);
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
