/**
 * JCO ERP 操作日誌系統
 * 記錄所有使用者操作
 */

const AuditLogger = {
    STORAGE_KEY: 'JCO_ERP_AUDIT_LOG',
    MAX_LOGS: 1000, // 最多保存 1000 條記錄

    /**
     * 記錄操作
     * @param {string} action - 操作類型 (CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT)
     * @param {string} module - 模組名稱 (orders, customers, inventory, etc.)
     * @param {string} description - 操作描述
     * @param {object} details - 詳細資料 (可選)
     */
    log(action, module, description, details = null) {
        const session = JSON.parse(localStorage.getItem('JCO_ERP_SESSION') || 'null');
        
        const logEntry = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            user: session ? {
                id: session.id,
                username: session.username,
                name: session.name,
                dept: session.dept
            } : { username: 'system', name: '系統' },
            action: action,
            module: module,
            description: description,
            details: details,
            userAgent: navigator.userAgent.substring(0, 100)
        };

        this.saveLog(logEntry);
        console.log(`📝 [Audit] ${action} - ${module}: ${description}`);
        return logEntry;
    },

    /**
     * 儲存日誌
     */
    saveLog(entry) {
        let logs = this.getLogs();
        logs.unshift(entry); // 新的在前面
        
        // 限制數量
        if (logs.length > this.MAX_LOGS) {
            logs = logs.slice(0, this.MAX_LOGS);
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    },

    /**
     * 取得所有日誌
     */
    getLogs() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    },

    /**
     * 依條件查詢日誌
     */
    query(filters = {}) {
        let logs = this.getLogs();
        
        if (filters.user) {
            logs = logs.filter(l => l.user.username === filters.user);
        }
        if (filters.action) {
            logs = logs.filter(l => l.action === filters.action);
        }
        if (filters.module) {
            logs = logs.filter(l => l.module === filters.module);
        }
        if (filters.dateFrom) {
            logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.dateFrom));
        }
        if (filters.dateTo) {
            logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.dateTo));
        }
        if (filters.limit) {
            logs = logs.slice(0, filters.limit);
        }
        
        return logs;
    },

    /**
     * 匯出日誌為 CSV
     */
    exportCSV() {
        const logs = this.getLogs();
        const headers = ['時間', '使用者', '部門', '操作', '模組', '描述'];
        const rows = logs.map(l => [
            new Date(l.timestamp).toLocaleString('zh-TW'),
            l.user.name,
            l.user.dept || '-',
            l.action,
            l.module,
            l.description
        ]);
        
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ERP-操作日誌-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    },

    /**
     * 清除日誌（需要管理員權限）
     */
    clear() {
        const session = JSON.parse(localStorage.getItem('JCO_ERP_SESSION') || 'null');
        if (session?.role !== 'admin') {
            console.error('只有管理員可以清除日誌');
            return false;
        }
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('日誌已清除');
        return true;
    },

    // === 便捷方法 ===
    
    logCreate(module, description, details) {
        return this.log('CREATE', module, description, details);
    },
    
    logUpdate(module, description, details) {
        return this.log('UPDATE', module, description, details);
    },
    
    logDelete(module, description, details) {
        return this.log('DELETE', module, description, details);
    },
    
    logView(module, description) {
        return this.log('VIEW', module, description);
    },
    
    logLogin() {
        const session = JSON.parse(localStorage.getItem('JCO_ERP_SESSION') || 'null');
        return this.log('LOGIN', 'system', `${session?.name || '未知'} 登入系統`);
    },
    
    logLogout() {
        const session = JSON.parse(localStorage.getItem('JCO_ERP_SESSION') || 'null');
        return this.log('LOGOUT', 'system', `${session?.name || '未知'} 登出系統`);
    }
};

// 全域可用
window.AuditLogger = AuditLogger;
