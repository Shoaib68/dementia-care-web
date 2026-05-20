/**
 * Performance Debugging Script
 * 
 * This script helps measure and diagnose slow navigation issues in the dashboard.
 * 
 * HOW TO USE:
 * 1. Open Chrome DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter to load the debugging tools
 * 5. Run: startNavigationDebug()
 * 6. Navigate from one page to another (e.g., Dashboard → Analytics)
 * 7. Check the console for detailed timing breakdown
 */

// Store original console methods
const originalLog = console.log;
const originalError = console.error;

// Debugging state
let isDebugging = false;
let navigationStart = 0;
let checkpoints = [];

/**
 * Start navigation performance debugging
 */
window.startNavigationDebug = function() {
  console.clear();
  console.log('%c🔍 Performance Debugging Started', 'color: #4CAF50; font-size: 16px; font-weight: bold');
  console.log('Navigate to any page now. Debugging will capture timing data...\n');
  
  isDebugging = true;
  checkpoints = [];
  navigationStart = performance.now();
  
  // Monitor React Query
  monitorReactQuery();
  
  // Monitor Network Requests
  monitorNetworkRequests();
  
  // Monitor Component Renders
  monitorComponentRenders();
  
  console.log('✅ Debugging hooks installed. Navigate to see results.\n');
};

/**
 * Stop navigation performance debugging
 */
window.stopNavigationDebug = function() {
  console.log('%c🛑 Performance Debugging Stopped', 'color: #F44336; font-size: 16px; font-weight: bold');
  isDebugging = false;
  
  // Print summary
  printPerformanceSummary();
};

/**
 * Monitor React Query behavior
 */
function monitorReactQuery() {
  // Intercept React Query cache operations
  const observer = new PerformanceObserver((list) => {
    if (!isDebugging) return;
    
    for (const entry of list.getEntries()) {
      if (entry.name.includes('api') || entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
        const elapsed = (entry.responseEnd - navigationStart).toFixed(2);
        checkpoints.push({
          type: 'network',
          name: entry.name,
          duration: entry.duration.toFixed(2),
          elapsed: elapsed,
          size: entry.transferSize || 0
        });
        
        console.log(
          `%c📡 ${elapsed}ms %c${entry.name}`,
          'color: #2196F3; font-weight: bold',
          'color: #666',
          `(${(entry.duration).toFixed(2)}ms, ${formatBytes(entry.transferSize || 0)})`
        );
      }
    }
  });
  
  observer.observe({ entryTypes: ['resource'] });
}

/**
 * Monitor network requests
 */
function monitorNetworkRequests() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const url = args[0];
    const fetchStart = performance.now();
    
    if (isDebugging) {
      console.log(`%c🌐 Fetch Start: ${url}`, 'color: #FF9800');
    }
    
    try {
      const response = await originalFetch.apply(this, args);
      const fetchEnd = performance.now();
      const duration = (fetchEnd - fetchStart).toFixed(2);
      const elapsed = (fetchEnd - navigationStart).toFixed(2);
      
      if (isDebugging) {
        checkpoints.push({
          type: 'fetch',
          name: url,
          duration: duration,
          elapsed: elapsed,
          status: response.status
        });
        
        console.log(
          `%c✅ ${elapsed}ms %cFetch Complete: ${url}`,
          'color: #4CAF50; font-weight: bold',
          'color: #666',
          `(${duration}ms, status: ${response.status})`
        );
      }
      
      return response;
    } catch (error) {
      const fetchEnd = performance.now();
      const duration = (fetchEnd - fetchStart).toFixed(2);
      
      if (isDebugging) {
        console.error(`%c❌ Fetch Failed: ${url}`, 'color: #F44336', `(${duration}ms)`);
      }
      
      throw error;
    }
  };
}

/**
 * Monitor component render timing
 */
function monitorComponentRenders() {
  // Monitor long tasks
  const observer = new PerformanceObserver((list) => {
    if (!isDebugging) return;
    
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) { // Tasks longer than 50ms
        const elapsed = (entry.startTime - navigationStart).toFixed(2);
        checkpoints.push({
          type: 'long-task',
          name: entry.name,
          duration: entry.duration.toFixed(2),
          elapsed: elapsed
        });
        
        console.warn(
          `%c⚠️ ${elapsed}ms %cLong Task Detected`,
          'color: #FF9800; font-weight: bold',
          'color: #666',
          `(${entry.duration.toFixed(2)}ms) - This may block rendering!`
        );
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.log('Long task monitoring not supported in this browser');
  }
}

/**
 * Print performance summary
 */
function printPerformanceSummary() {
  console.log('\n%c📊 Performance Summary', 'color: #9C27B0; font-size: 18px; font-weight: bold');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Group by type
  const networkCalls = checkpoints.filter(c => c.type === 'network' || c.type === 'fetch');
  const longTasks = checkpoints.filter(c => c.type === 'long-task');
  
  console.log(`%c📡 Network Activity (${networkCalls.length} requests)`, 'color: #2196F3; font-weight: bold');
  networkCalls.forEach(checkpoint => {
    console.log(
      `  ${checkpoint.elapsed}ms: ${checkpoint.name.substring(checkpoint.name.lastIndexOf('/') + 1)} (${checkpoint.duration}ms)`
    );
  });
  
  if (longTasks.length > 0) {
    console.log(`\n%c⚠️ Long Tasks (${longTasks.length} blocking tasks)`, 'color: #FF9800; font-weight: bold');
    longTasks.forEach(checkpoint => {
      console.log(`  ${checkpoint.elapsed}ms: ${checkpoint.name} (${checkpoint.duration}ms)`);
    });
  }
  
  // Calculate total time
  const totalTime = checkpoints.length > 0 
    ? Math.max(...checkpoints.map(c => parseFloat(c.elapsed)))
    : 0;
  
  console.log(`\n%c⏱️ Total Navigation Time: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`, 
    'color: #9C27B0; font-weight: bold; font-size: 14px');
  
  // Check for issues
  console.log('\n%c🔍 Detected Issues:', 'color: #F44336; font-weight: bold');
  
  const duplicateRequests = findDuplicateRequests(networkCalls);
  if (duplicateRequests.length > 0) {
    console.log(`  ❌ ${duplicateRequests.length} duplicate API calls detected`);
    duplicateRequests.forEach(dup => {
      console.log(`    - ${dup.url} (${dup.count} calls)`);
    });
  }
  
  if (longTasks.length > 0) {
    console.log(`  ❌ ${longTasks.length} blocking tasks > 50ms`);
  }
  
  const totalNetworkTime = networkCalls.reduce((sum, c) => sum + parseFloat(c.duration), 0);
  console.log(`  📊 Total network time: ${totalNetworkTime.toFixed(2)}ms`);
  
  const totalBlockingTime = longTasks.reduce((sum, c) => sum + parseFloat(c.duration), 0);
  if (totalBlockingTime > 0) {
    console.log(`  ⚠️ Total blocking time: ${totalBlockingTime.toFixed(2)}ms`);
  }
}

/**
 * Find duplicate requests
 */
function findDuplicateRequests(requests) {
  const urlCounts = {};
  
  requests.forEach(req => {
    const url = req.name.split('?')[0]; // Remove query params
    urlCounts[url] = (urlCounts[url] || 0) + 1;
  });
  
  return Object.entries(urlCounts)
    .filter(([url, count]) => count > 1)
    .map(([url, count]) => ({ url, count }));
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Quick check current bundle sizes loaded
 */
window.checkBundleSize = function() {
  const resources = performance.getEntriesByType('resource');
  const jsResources = resources.filter(r => r.name.endsWith('.js'));
  
  console.log('%c📦 JavaScript Bundle Sizes', 'color: #9C27B0; font-size: 16px; font-weight: bold');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let totalSize = 0;
  jsResources.forEach(resource => {
    const size = resource.transferSize || 0;
    totalSize += size;
    const fileName = resource.name.substring(resource.name.lastIndexOf('/') + 1);
    console.log(`${formatBytes(size).padEnd(10)} - ${fileName}`);
  });
  
  console.log(`\n%cTotal JS: ${formatBytes(totalSize)}`, 'color: #4CAF50; font-weight: bold; font-size: 14px');
  
  // Highlight large bundles
  const largeBundles = jsResources.filter(r => r.transferSize > 100000); // > 100KB
  if (largeBundles.length > 0) {
    console.log(`\n%c⚠️ Large bundles (> 100KB):`, 'color: #FF9800; font-weight: bold');
    largeBundles.forEach(r => {
      const fileName = r.name.substring(r.name.lastIndexOf('/') + 1);
      console.log(`  ${formatBytes(r.transferSize)} - ${fileName}`);
    });
  }
};

// Instructions
console.log('%c🔧 Performance Debugging Tools Loaded', 'color: #4CAF50; font-size: 18px; font-weight: bold');
console.log('\n%cAvailable Commands:', 'color: #2196F3; font-weight: bold');
console.log('  %cstartNavigationDebug()%c - Start tracking navigation performance', 'color: #FF9800', 'color: #666');
console.log('  %cstopNavigationDebug()%c  - Stop tracking and show summary', 'color: #FF9800', 'color: #666');
console.log('  %ccheckBundleSize()%c      - Check current loaded bundle sizes', 'color: #FF9800', 'color: #666');
console.log('\n%c💡 Quick Start: Run %cstartNavigationDebug()%c then navigate', 'color: #666', 'color: #4CAF50; font-weight: bold', 'color: #666');
