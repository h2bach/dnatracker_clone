/**
 * Memory Monitoring Utility
 * Provides memory usage tracking and leak detection for the DNA Tracker application
 */

var os = require('os');
var fs = require('fs');
var path = require('path');

var MemoryMonitor = {
    // Configuration
    config: {
        enabled: process.env.NODE_ENV !== 'production',
        logInterval: 30000, // 30 seconds
        warningThreshold: 0.8, // 80% of system memory
        criticalThreshold: 0.9, // 90% of system memory
        logFile: './logs/memory-usage.log'
    },

    // State tracking
    state: {
        timers: [],
        watchers: [],
        processes: [],
        lastGC: null,
        samples: []
    },

    /**
     * Initialize memory monitoring
     */
    init: function() {
        if (!this.config.enabled) return;

        console.log('Memory Monitor initialized');
        
        // Ensure log directory exists
        var logDir = path.dirname(this.config.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Start periodic monitoring
        this.startMonitoring();
        
        // Setup process exit handlers
        this.setupExitHandlers();
    },

    /**
     * Start periodic memory monitoring
     */
    startMonitoring: function() {
        var self = this;
        
        var monitorInterval = setInterval(function() {
            self.checkMemoryUsage();
        }, this.config.logInterval);
        
        this.state.timers.push(monitorInterval);
    },

    /**
     * Check current memory usage and log if concerning
     */
    checkMemoryUsage: function() {
        var memUsage = process.memoryUsage();
        var totalMem = os.totalmem();
        var freeMem = os.freemem();
        var usedMem = totalMem - freeMem;
        var usageRatio = usedMem / totalMem;

        var timestamp = new Date().toISOString();
        var logEntry = {
            timestamp: timestamp,
            process: {
                rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
                external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
            },
            system: {
                total: Math.round(totalMem / 1024 / 1024) + 'MB',
                free: Math.round(freeMem / 1024 / 1024) + 'MB',
                used: Math.round(usedMem / 1024 / 1024) + 'MB',
                usagePercent: Math.round(usageRatio * 100) + '%'
            },
            timers: this.state.timers.length,
            watchers: this.state.watchers.length,
            processes: this.state.processes.length
        };

        // Store sample for trend analysis
        this.state.samples.push({
            timestamp: timestamp,
            heapUsed: memUsage.heapUsed,
            rss: memUsage.rss
        });

        // Keep only last 100 samples
        if (this.state.samples.length > 100) {
            this.state.samples.shift();
        }

        // Log to file
        this.logToFile(JSON.stringify(logEntry));

        // Check thresholds and alert
        if (usageRatio > this.config.criticalThreshold) {
            console.error('CRITICAL: Memory usage at ' + Math.round(usageRatio * 100) + '%');
            this.forceGarbageCollection();
        } else if (usageRatio > this.config.warningThreshold) {
            console.warn('WARNING: Memory usage at ' + Math.round(usageRatio * 100) + '%');
        }

        // Detect potential leaks
        this.detectMemoryLeaks();
    },

    /**
     * Detect potential memory leaks based on usage trends
     */
    detectMemoryLeaks: function() {
        if (this.state.samples.length < 10) return;

        var recent = this.state.samples.slice(-10);
        var older = this.state.samples.slice(-20, -10);
        
        if (older.length === 0) return;

        var recentAvg = recent.reduce(function(sum, sample) {
            return sum + sample.heapUsed;
        }, 0) / recent.length;

        var olderAvg = older.reduce(function(sum, sample) {
            return sum + sample.heapUsed;
        }, 0) / older.length;

        // If memory is consistently growing by more than 20%
        if (recentAvg > olderAvg * 1.2) {
            console.warn('POTENTIAL MEMORY LEAK DETECTED');
            console.warn('Recent average heap: ' + Math.round(recentAvg / 1024 / 1024) + 'MB');
            console.warn('Previous average heap: ' + Math.round(olderAvg / 1024 / 1024) + 'MB');
            console.warn('Active timers: ' + this.state.timers.length);
            console.warn('Active watchers: ' + this.state.watchers.length);
        }
    },

    /**
     * Force garbage collection if available
     */
    forceGarbageCollection: function() {
        if (global.gc) {
            console.log('Forcing garbage collection...');
            global.gc();
            this.state.lastGC = new Date();
        } else {
            console.log('Garbage collection not available. Run with --expose-gc flag.');
        }
    },

    /**
     * Log entry to file
     */
    logToFile: function(entry) {
        try {
            fs.appendFileSync(this.config.logFile, entry + '\n');
        } catch (err) {
            console.error('Failed to write to memory log:', err.message);
        }
    },

    /**
     * Register a timer for tracking
     */
    registerTimer: function(timerId, description) {
        this.state.timers.push({
            id: timerId,
            description: description || 'Unnamed timer',
            created: new Date()
        });
    },

    /**
     * Unregister a timer
     */
    unregisterTimer: function(timerId) {
        this.state.timers = this.state.timers.filter(function(timer) {
            return timer.id !== timerId;
        });
    },

    /**
     * Register an Angular watcher for tracking
     */
    registerWatcher: function(scope, expression) {
        var watchId = Date.now() + Math.random();
        this.state.watchers.push({
            id: watchId,
            scope: scope,
            expression: expression || 'Unnamed watcher',
            created: new Date()
        });
        return watchId;
    },

    /**
     * Unregister an Angular watcher
     */
    unregisterWatcher: function(watchId) {
        this.state.watchers = this.state.watchers.filter(function(watcher) {
            return watcher.id !== watchId;
        });
    },

    /**
     * Register a child process for tracking
     */
    registerProcess: function(process, description) {
        this.state.processes.push({
            process: process,
            description: description || 'Unnamed process',
            created: new Date(),
            pid: process.pid
        });
    },

    /**
     * Unregister a child process
     */
    unregisterProcess: function(process) {
        this.state.processes = this.state.processes.filter(function(proc) {
            return proc.process !== process;
        });
    },

    /**
     * Get current memory report
     */
    getMemoryReport: function() {
        return {
            timestamp: new Date().toISOString(),
            process: process.memoryUsage(),
            system: {
                total: os.totalmem(),
                free: os.freemem(),
                loadavg: os.loadavg()
            },
            uptime: process.uptime(),
            activeResources: {
                timers: this.state.timers.length,
                watchers: this.state.watchers.length,
                processes: this.state.processes.length
            },
            samples: this.state.samples.length
        };
    },

    /**
     * Setup process exit handlers for cleanup
     */
    setupExitHandlers: function() {
        var self = this;
        
        function cleanup() {
            console.log('Cleaning up memory monitor...');
            self.state.timers.forEach(function(timer) {
                if (timer.id) clearTimeout(timer.id);
            });
            self.state.processes.forEach(function(proc) {
                if (proc.process && proc.process.kill) {
                    proc.process.kill();
                }
            });
        }

        process.on('exit', cleanup);
        process.on('SIGINT', function() {
            cleanup();
            process.exit();
        });
        process.on('SIGTERM', function() {
            cleanup();
            process.exit();
        });
    },

    /**
     * Stop monitoring and cleanup
     */
    stop: function() {
        this.state.timers.forEach(function(timer) {
            if (timer.id) clearTimeout(timer.id);
        });
        this.state.timers = [];
        console.log('Memory monitor stopped');
    }
};

// Auto-initialize if not in production
if (MemoryMonitor.config.enabled) {
    MemoryMonitor.init();
}

module.exports = MemoryMonitor;
